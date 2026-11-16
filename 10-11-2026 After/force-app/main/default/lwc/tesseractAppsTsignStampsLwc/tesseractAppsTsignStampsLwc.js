import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getStamps      from '@salesforce/apex/TsignStampController.getStamps';
import saveStamp      from '@salesforce/apex/TsignStampController.saveStamp';
import deleteStamp    from '@salesforce/apex/TsignStampController.deleteStamp';
import setDefaultStamp from '@salesforce/apex/TsignStampController.setDefaultStamp';
import getOrg from '@salesforce/apex/TsignUserManagementController.getOrg';

const AWS_DELETE_URL = 'https://tesseractapps.com/delete-file';

const backend = {
    async load() {
        const rows = await getStamps();
        return (rows || []).map(r => ({
            id:          r.Id,
            displayName: r.Name || 'Stamp',
            dataUrl:     r.AWS_URL__c,
            awsKey:      r.AWS_Key__c,
            stampJson:   r.Stamp_JSON__c, // <-- Map JSON from Apex
            isDefault:   !!r.Is_Default__c,
            createdDate: new Date(r.CreatedDate).toLocaleDateString()
        }));
    },
    async save(stamp) {
        const rec = await saveStamp({
            recordId:  null,
            name:      stamp.displayName,
            imageUrl:  stamp.dataUrl,
            imageKey:  stamp.awsKey,
            stampJson: stamp.stampJson, // <-- Pass to Apex
            isDefault: stamp.isDefault === true
        });
        return { ...stamp, id: rec.Id };
    },
    async update(stamp) {
        const rec = await saveStamp({
            recordId:  stamp.id,
            name:      stamp.displayName,
            imageUrl:  stamp.dataUrl,
            imageKey:  stamp.awsKey,
             stampJson: stamp.stampJson, // <-- Pass to Apex
            isDefault: stamp.isDefault === true
        });
        return { ...stamp, id: rec.Id };
    },
    async remove(id) {
        await deleteStamp({ recordId: id });
        return id;
    },
    async setDefault(id) {
        await setDefaultStamp({ recordId: id });
        return id;
    }
};

export default class TesseractAppsTsignStampsLwc extends LightningElement {
    @track stamps = [];
    @track showForm = false;

    // Form State
    @track editingId = null;
    @track stampName = '';
    @track uploadedImageUrl = null;
    @track zoomLevel = 1;
    @track cropType = 'circle';

    // AWS upload state
    @track isFileExpand = false;
    @track isLogoLoading = false;
    uploadRecordId = null;
    uploadedFile = null;
    _uploadResolve = null;
    _uploadReject = null; // <-- ADD THIS

    // Old S3 locator for update
    oldStampUrl = '';
    oldStampKey = '';

    // ---- Getters ----
    get showListSection() { return this.stamps.length > 0 && !this.showForm; }
    get showEmptyState()  { return this.stamps.length === 0 && !this.showForm; }
    get isEditMode()      { return this.editingId !== null; }
    get modalTitle()      { return this.isEditMode ? 'Edit Stamp' : 'Create Stamp'; }

    get isSaveDisabled() {
        return this.isLogoLoading || !this.stampName.trim() || !this.uploadedImageUrl;
    }

    get showZoom() { return this.uploadedImageUrl && this.cropType !== 'none'; }

    get stampCountLabel() {
        const n = this.stamps.length;
        if (n === 0) return 'No saved stamps';
        if (n === 1) return '1 saved stamp';
        return `${n} saved stamps`;
    }

    get imageStyle() { return `transform: scale(${this.zoomLevel});`; }

    get cropAreaClass() {
        if (this.cropType === 'none') return 'crop-area-container crop-none';
        if (this.cropType === 'square') return 'crop-area-container crop-square';
        return 'crop-area-container crop-circle';
    }

    get maskClass() {
        if (this.cropType === 'none') return 'crop-mask mask-none';
        if (this.cropType === 'square') return 'crop-mask mask-square';
        return 'crop-mask mask-circle';
    }
     @track currentUserOrgId = ''; // NEW
    @track tempStampJson = null;  // NEW

    // ---- Lifecycle ----
    async connectedCallback() {
        try {
            this.isLogoLoading = true;
            const rows = await backend.load();
            this.stamps = rows;
            console.log('[STAMP-INIT] loaded stamps:', JSON.parse(JSON.stringify(rows)));
             this.loadOrgId(); // NEW
        } catch (e) {
            console.error('[STAMP-INIT] load failed', e);
            this.toast('Error', e.body ? e.body.message : 'Could not load stamps.', 'error');
        } finally {
            this.isLogoLoading = false;
        }
    }
    async loadOrgId() {
        try {
            const orgList = await getOrg();
            if (orgList && orgList.length > 0) {
                this.currentUserOrgId = orgList[0].Id;
            }
        } catch (error) {
            console.error('Error loading org:', error);
        }
    }

    // ---- Modal lifecycle ----
    handleModalToggle(event) {
        this.showForm = event.target.open;
        console.log('[STAMP-DIALOG] modal toggled:', {
            open: event.target.open,
            showForm: this.showForm,
            isEditMode: this.isEditMode,
            modalTitle: this.modalTitle
        });
    }

    openForm() {
        console.log('[STAMP-DIALOG] openForm clicked');
        this.resetForm();
        this.editingId = null;
        this.refs.stampModal.showModal();
    }

    handleEdit(event) {
        const id = event.currentTarget.dataset.id;
        console.log('[STAMP-DIALOG] edit clicked:', { id });

        const stampToEdit = this.stamps.find(s => s.id === id);
        if (!stampToEdit) {
            console.warn('[STAMP-DIALOG] stamp not found for id:', id);
            return;
        }

        this.resetForm();
        this.editingId = stampToEdit.id;
        this.stampName = stampToEdit.displayName;
        this.uploadedImageUrl = stampToEdit.dataUrl;
        this.oldStampUrl = stampToEdit.dataUrl || '';
        this.oldStampKey = stampToEdit.awsKey || '';
        this.tempStampJson = stampToEdit.stampJson || null; 
        console.log('[STAMP-DIALOG] edit state prepared:', {
            editingId: this.editingId,
            stampName: this.stampName,
            oldStampKey: this.oldStampKey,
            hasImage: !!this.uploadedImageUrl
        });
        this.refs.stampModal.showModal();
    }

    handleCancel() {
        console.log('[STAMP-DIALOG] cancel clicked. isLogoLoading =', this.isLogoLoading);
        if (this.isLogoLoading) return;
        this.refs.stampModal.close();
        this.isFileExpand = false;
        this.uploadedFile = null;
        this.uploadRecordId = null;
        this._uploadResolve = null;
    }

    resetForm() {
        this.editingId = null;
        this.stampName = '';
        this.uploadedImageUrl = null;
        this.zoomLevel = 1;
        this.cropType = 'circle';
        this.oldStampUrl = '';
        this.oldStampKey = '';
        this.uploadedFile = null;
        this.uploadRecordId = null;
        this.isFileExpand = false;
        this.isLogoLoading = false;
        console.log('[STAMP-STATE] form reset');
    }

    // ---- Form handlers ----
    handleNameChange(event) {
        const value = event.target.value;
        console.log('[STAMP-INPUT] stampName changed:', {
            value,
            length: value ? value.length : 0,
            trimmed: value ? value.trim() : ''
        });
        this.stampName = value;
        console.log('[STAMP-STATE] stampName =', this.stampName,
                    '| isSaveDisabled =', this.isSaveDisabled);
    }

    handleFileUpload(event) {
        const file = event.target.files && event.target.files[0];
        console.log('[STAMP-INPUT] file selected:', file ? {
            name: file.name,
            type: file.type,
            sizeBytes: file.size,
            sizeHuman: this.humanSize(file.size),
            lastModified: file.lastModified
        } : null);

        if (!file) {
            console.warn('[STAMP-INPUT] no file in event');
            return;
        }
        if (!file.type.startsWith('image/')) {
            console.warn('[STAMP-INPUT] rejected non-image file:', file.type);
            return this.toast('Invalid file', 'Please select an image.', 'error');
        }

        const reader = new FileReader();
        reader.onload = () => {
            this.uploadedImageUrl = reader.result;
            this.zoomLevel = 1;
            console.log('[STAMP-STATE] image loaded:', {
                dataUrlLength: reader.result ? reader.result.length : 0,
                mime: (/^data:(.*?);/.exec(reader.result) || [])[1] || 'unknown',
                zoomReset: this.zoomLevel,
                isSaveDisabled: this.isSaveDisabled
            });
        };
        reader.onerror = (err) => {
            console.error('[STAMP-INPUT] FileReader error:', err);
        };
        reader.readAsDataURL(file);
    }

    handleZoomChange(event) {
        const value = event.target.value;
        this.zoomLevel = parseFloat(value);
        console.log('[STAMP-INPUT] zoomLevel changed:', {
            raw: value,
            parsed: this.zoomLevel,
            cropType: this.cropType
        });
    }

    handleCropTypeChange(event) {
        const value = event.target.value;
        this.cropType = value;
        console.log('[STAMP-INPUT] cropType changed:', {
            value: this.cropType,
            cropAreaClass: this.cropAreaClass,
            maskClass: this.maskClass,
            showZoom: this.showZoom
        });
    }

    handleResetCrop() {
        console.log('[STAMP-INPUT] reset crop clicked. Before:', {
            zoomLevel: this.zoomLevel,
            cropType: this.cropType
        });
        this.zoomLevel = 1;
        console.log('[STAMP-STATE] after reset → zoomLevel =', this.zoomLevel);
    }

    // ---- Save ----
    async handleSave() {
        console.group('[STAMP-SAVE] start');
        console.log('isEditMode:', this.isEditMode,
                    '| editingId:', this.editingId,
                    '| stampName:', this.stampName,
                    '| cropType:', this.cropType,
                    '| zoomLevel:', this.zoomLevel,
                    '| oldStampKey:', this.oldStampKey);

        if (this.isLogoLoading) {
            console.warn('[STAMP-SAVE] ignored — upload already in progress');
            console.groupEnd();
            return;
        }

        try {
            // Phase 1 — crop
            console.log('[STAMP-SAVE] Phase 1 — cropping image');
            const dataUrl = await this.processCroppedImage();
            console.log('[STAMP-SAVE] crop result:', {
                dataUrlLength: dataUrl ? dataUrl.length : 0,
                mime: (/^data:(.*?);/.exec(dataUrl) || [])[1] || 'unknown'
            });

            const file = await this.dataUrlToFile(dataUrl, this.buildFileName());
            console.log('[STAMP-SAVE] cropped File:', {
                name: file.name,
                type: file.type,
                sizeBytes: file.size,
                sizeHuman: this.humanSize(file.size)
            });

            // Phase 2 — upload to AWS
            console.log('[STAMP-SAVE] Phase 2 — uploading to AWS');
            this.isLogoLoading = true;
            this.uploadedFile = null;
            this.uploadRecordId = this.uploadRecordId || this.makeRecordId();
            console.log('[STAMP-SAVE] uploadRecordId:', this.uploadRecordId);
            this.isFileExpand = true;

            //await this.waitForChildAndUpload(file);
               await this.uploadToChildComponent(file);
            console.log('[STAMP-SAVE] upload returned:', JSON.parse(JSON.stringify(this.uploadedFile || {})));

            if (!this.uploadedFile || !this.uploadedFile.url) {
                throw new Error('Upload did not complete.');
            }

            // Phase 3 — build record
            const existing = this.isEditMode
                ? this.stamps.find(s => s.id === this.editingId)
                : null;

            const stamp = {
                id: this.isEditMode ? this.editingId : this.generateId(),
                displayName: this.stampName.trim(),
                dataUrl: this.uploadedFile.url,
                awsKey: this.uploadedFile.key,
                stampJson: this.tempStampJson, // <-- Include JSON
                isDefault: existing ? existing.isDefault : this.stamps.length === 0,
                createdDate: existing ? existing.createdDate : new Date().toLocaleDateString()
            };
            console.log('[STAMP-SAVE] Phase 3 — record to persist:', JSON.parse(JSON.stringify(stamp)));

            // Phase 4 — persist
            if (this.isEditMode) {
                this.stamps = this.stamps.map(s => s.id === stamp.id ? stamp : s);
                const saved = await backend.update(stamp);
                console.log('[STAMP-SAVE] backend.update returned:', JSON.parse(JSON.stringify(saved)));
            } else {
                this.stamps = [stamp, ...this.stamps];
                const saved = await backend.save(stamp);
                console.log('[STAMP-SAVE] backend.save returned:', JSON.parse(JSON.stringify(saved)));
                // swap local uuid for real Salesforce Id
                this.stamps = this.stamps.map(s =>
                    s.id === stamp.id ? { ...s, id: saved.id } : s
                );
            }

            // Phase 5 — delete old S3 object
            if (this.isEditMode && this.oldStampKey && this.oldStampKey !== stamp.awsKey) {
                console.log('[STAMP-SAVE] Phase 5 — deleting old S3 key:', this.oldStampKey);
                await this.deleteOldFileFromAWS(this.oldStampKey);
            } else {
                console.log('[STAMP-SAVE] Phase 5 — skipped old-key delete:', {
                    isEditMode: this.isEditMode,
                    oldStampKey: this.oldStampKey,
                    newKey: stamp.awsKey
                });
            }

            console.log('[STAMP-SAVE] SUCCESS — total stamps:', this.stamps.length);
            this.toast('Success', this.isEditMode ? 'Stamp updated.' : 'Stamp saved.', 'success');

            this.oldStampKey = '';
            this.oldStampUrl = '';
            this.uploadedFile = null;
            this.uploadRecordId = null;
            this.isFileExpand = false;
            this.refs.stampModal.close();

        } catch (e) {
            console.error('[STAMP-SAVE] FAILED', e);
            this.toast('Error', this.readApexError(e), 'error');
        } finally {
            this.isLogoLoading = false;
            console.groupEnd();
        }
    }

    // ---- Crop ----
    processCroppedImage() {
        console.log('[STAMP-CROP] start:', { cropType: this.cropType, zoomLevel: this.zoomLevel });
        return new Promise((resolve, reject) => {
            if (!this.uploadedImageUrl) {
                console.error('[STAMP-CROP] no image');
                reject(new Error('No image selected.'));
                return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    console.log('[STAMP-CROP] image loaded:', { w: img.width, h: img.height });

                    if (this.cropType === 'none') {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        canvas.getContext('2d').drawImage(img, 0, 0);
                        const out = canvas.toDataURL('image/png');
                        console.log('[STAMP-CROP] no-crop result length:', out.length);
                        resolve(out);
                        return;
                    }

                    const canvas = document.createElement('canvas');
                    const size = 400;
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');

                    if (this.cropType === 'circle') {
                        ctx.beginPath();
                        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                    }

                    const imgRatio = img.width / img.height;
                    let drawWidth = size;
                    let drawHeight = size;
                    if (imgRatio > 1) drawHeight = size / imgRatio;
                    else drawWidth = size * imgRatio;

                    drawWidth *= this.zoomLevel;
                    drawHeight *= this.zoomLevel;

                    const offsetX = (size - drawWidth) / 2;
                    const offsetY = (size - drawHeight) / 2;

                    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                    const out = canvas.toDataURL('image/png');
                    console.log('[STAMP-CROP] result:', {
                        drawWidth: Math.round(drawWidth),
                        drawHeight: Math.round(drawHeight),
                        offsetX: Math.round(offsetX),
                        offsetY: Math.round(offsetY),
                        dataUrlLength: out.length
                    });
                    resolve(out);
                } catch (err) {
                    console.error('[STAMP-CROP] canvas error (likely CORS):', err);
                    reject(err);
                }
            };
            img.onerror = () => {
                console.error('[STAMP-CROP] image load failed');
                reject(new Error('Could not load image for cropping.'));
            };
            img.src = this.uploadedImageUrl;
        });
    }

    dataUrlToFile(dataUrl, fileName) {
        return new Promise((resolve) => {
            const [meta, b64] = dataUrl.split(',');
            const mimeMatch = /:(.*?);/.exec(meta);
            const mime = mimeMatch ? mimeMatch[1] : 'image/png';
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            resolve(new File([bytes], fileName, { type: mime }));
        });
    }

    buildFileName() {
        const safe = (this.stampName || 'stamp')
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^\w.-]/g, '_');
        return `${safe}_${Date.now()}.png`;
    }

    // ---- Child upload ----
    waitForChildAndUpload(file) {
        console.log('[STAMP-UPLOAD] waiting for c-document-office-service…');
        return new Promise((resolve) => {
            let settled = false;
            const done = () => {
                if (settled) return;
                settled = true;
                this._uploadResolve = null;
                resolve();
            };
            this._uploadResolve = done;

            setTimeout(() => {
                if (!settled) {
                    console.error('[STAMP-UPLOAD] timeout — upload did not complete in 60s');
                    done();
                }
            }, 60000);

            setTimeout(() => {
                const svc = this.template.querySelector('c-document-office-service');
                if (!svc) {
                    console.error('[STAMP-UPLOAD] child component not found in DOM');
                    done();
                    return;
                }
                console.log('[STAMP-UPLOAD] pushing file to child:', {
                    name: file.name, size: file.size, type: file.type
                });
                svc.incomingFiles = [file];
                svc.confirmUpload = true;
                console.log('[STAMP-UPLOAD] child setters invoked');
            }, 300);
        });
    }

    // Replace waitForChildAndUpload with this:
    /* async uploadToChildComponent(file) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const svc = this.template.querySelector('c-t-signaws-batch-lwc');
                if (!svc) {
                    console.error('[STAMP-UPLOAD] Child component not found');
                    return reject(new Error('Upload component not found'));
                }

                this._uploadResolve = resolve;
                this._uploadReject = reject;

                const doUpload = async () => {
                    try {
                        svc.removeEventListener('configload', doUpload);
                        await svc.uploadPayload(file, file.name, 'image/png');
                    } catch (e) {
                        console.error('[STAMP-UPLOAD] uploadPayload threw error', e);
                        if (this._uploadReject) this._uploadReject(e);
                    }
                };

                if (svc.isConfigLoaded) {
                    doUpload();
                } else {
                    console.log('[STAMP-UPLOAD] Waiting for child config to load...');
                    svc.addEventListener('configload', doUpload, { once: true });
                }
            }, 300); 
        });
    } */


    // Replace handleAwsUploadComplete with this:
  /*   handleAwsUploadComplete(event) {
        const files = (event.detail && event.detail.files) || [];
        this.uploadedFile = files[0] || null;
        
        // Store the JSON payload
        if (this.uploadedFile) {
            this.tempStampJson = JSON.stringify(event.detail);
        }
        
        this.isLogoLoading = false;
        if (this._uploadResolve) { 
            this._uploadResolve(); 
            this._uploadResolve = null; 
        }
    } */
    


    /* handleAwsUploadComplete(event) {
        console.group('[STAMP-AWS] uploadcomplete received');

        const detail = event && event.detail ? event.detail : null;
        console.log('raw event.detail:', JSON.parse(JSON.stringify(detail || {})));

        const files = (detail && detail.files) || [];
        console.log('files count:', files.length);
        files.forEach((f, i) => {
            console.log(`files[${i}]:`, JSON.parse(JSON.stringify(f)));
        });

        this.uploadedFile = files[0] || null;
        console.log('stored uploadedFile:', JSON.parse(JSON.stringify(this.uploadedFile || {})));

        this.isLogoLoading = false;
        if (this._uploadResolve) { this._uploadResolve(); this._uploadResolve = null; }

        console.groupEnd();
    } */
     async uploadToChildComponent(file) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const svc = this.template.querySelector('c-t-signaws-batch-lwc');
                if (!svc) {
                    console.error('[STAMP-UPLOAD] Child component not found');
                    return reject(new Error('Upload component not found'));
                }

                this._uploadResolve = resolve;
                this._uploadReject = reject;

                const doUpload = async () => {
                    try {
                        svc.removeEventListener('configload', doUpload);
                        await svc.uploadPayload(file, file.name, 'image/png');
                    } catch (e) {
                        console.error('[STAMP-UPLOAD] uploadPayload threw error', e);
                        if (this._uploadReject) this._uploadReject(e);
                    }
                };

                if (svc.isConfigLoaded) {
                    doUpload();
                } else {
                    console.log('[STAMP-UPLOAD] Waiting for child config to load...');
                    svc.addEventListener('configload', doUpload, { once: true });
                }
            }, 300); 
        });
    }

    handleAwsUploadComplete(event) {
        console.group('[STAMP-AWS] uploadcomplete received');
        const detail = event && event.detail ? event.detail : null;
        
        const files = (detail && detail.files) || [];
        this.uploadedFile = files[0] || null;
        
        // Store the JSON payload
        if (this.uploadedFile) {
            this.tempStampJson = JSON.stringify(event.detail);
        }
        
        this.isLogoLoading = false;
        
        if (this._uploadResolve) { 
            this._uploadResolve(); 
            this._uploadResolve = null; 
        }
        console.groupEnd();
    }

    handleFileDeleted(event) {
        console.log('[STAMP-AWS] filedeleted received:', JSON.parse(JSON.stringify(event.detail || {})));
        this.isLogoLoading = false;
        this.isFileExpand = false;
        if (this._uploadResolve) { this._uploadResolve(); this._uploadResolve = null; }
    }

    makeRecordId() {
        const ts = Date.now().toString(36);
        const rnd = crypto.getRandomValues(new Uint8Array(6));
        const hex = Array.from(rnd).map(b => b.toString(16).padStart(2, '0')).join('');
        return `rec_${ts}_${hex}`;
    }

    async deleteOldFileFromAWS(key) {
        if (!key) return;
        try {
            console.log('[AWS-DELETE] deleting key:', key);
            const resp = await fetch(AWS_DELETE_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            const text = await resp.text();
            console.log('[AWS-DELETE] status:', resp.status, 'body:', text);
        } catch (e) {
            console.error('[AWS-DELETE] failed', e);
        }
    }

    // ---- List actions ----
    async handleDelete(event) {
        const id = event.currentTarget.dataset.id;
        console.log('[STAMP-LIST] delete clicked:', { id });

        const removed = this.stamps.find(s => s.id === id);

        // Apex first
        try {
            await backend.remove(id);
            console.log('[STAMP-LIST] backend.remove returned OK');
        } catch (e) {
            console.warn('[STAMP-LIST] backend.remove error', e);
            this.toast('Error', this.readApexError(e), 'error');
            return;
        }

        // Local state
        let next = this.stamps.filter(s => s.id !== id);
        if (removed && removed.isDefault && next.length) {
            next = next.map((s, i) => ({ ...s, isDefault: i === 0 }));
        }
        this.stamps = next;
        console.log('[STAMP-STATE] after delete:', {
            removed, remainingCount: this.stamps.length
        });

        // Best-effort S3 cleanup
        if (removed && removed.awsKey) {
            this.deleteOldFileFromAWS(removed.awsKey);
        }

        this.toast('Deleted', 'Stamp removed.', 'success');
    }

    async handleSetDefault(event) {
        const id = event.currentTarget.dataset.id;
        console.log('[STAMP-LIST] set default clicked:', { id });

        const prevDefault = this.stamps.find(s => s.isDefault);

        try {
            await backend.setDefault(id);
            console.log('[STAMP-LIST] backend.setDefault returned OK');
        } catch (e) {
            console.warn('[STAMP-LIST] backend.setDefault error', e);
            this.toast('Error', this.readApexError(e), 'error');
            return;
        }

        this.stamps = this.stamps.map(s => ({ ...s, isDefault: s.id === id }));
        console.log('[STAMP-STATE] after setDefault:', {
            prevDefaultId: prevDefault ? prevDefault.id : null,
            newDefaultId: id
        });
    }

    // ---- Utils ----
    generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'stamp-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
    }

    humanSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024, sizes = ['B','KB','MB','GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    readApexError(e) {
        if (!e) return 'Unknown error';
        if (Array.isArray(e.body)) return e.body.map(x => x.message).join(', ');
        if (e.body && e.body.message) return e.body.message;
        if (e.message) return e.message;
        return 'Unknown error';
    }

    toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}