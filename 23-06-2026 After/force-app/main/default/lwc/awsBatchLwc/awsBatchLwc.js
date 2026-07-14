import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import uploadFiles from '@salesforce/apex/AwsBatchController.uploadFiles';
import deleteFiles from '@salesforce/apex/AwsBatchController.deleteFiles';
import getUploadConfig from '@salesforce/apex/AwsBatchController.getUploadConfig';

export default class AwsBatchLwc extends LightningElement {

acceptedFormats = '';
maxFileSize = null;
allowMultiple = false;
maxFileCount = null;
isUnlimited = false;
basePath = '';
showUI = true;
isConfigLoaded = false;

    // ===== STATE =====
    @track uploadFileList = [];
    @track uploadedFiles = [];
    @track responseText = '';
    @track isDragging = false;

@api moduleName;
@api organisationId;
@api existingFilesJson;

async connectedCallback() {

    if(this.organisationId){

        await this.initializeUploadConfig();
    }
}
  async initializeUploadConfig() {
        console.log('🔹 Initializing upload config for module:', this.moduleName);

        getUploadConfig({ moduleName: this.moduleName })
            .then(config => {
                console.log('✅ Metadata fetched:', JSON.stringify(config));

                if (!config) {
                    throw new Error('Upload config missing');
                }

                // Assign config values
                this.acceptedFormats = config.formats;
                this.maxFileSize = config.maxSizeBytes;
                this.allowMultiple = config.allowMultiple;
                this.maxFileCount = config.maxFileCount;
                this.isUnlimited = config.isUnlimited;
                this.showUI = config.showUI ?? true;

                if (this.isUnlimited) {
                    console.log('♾️ Unlimited file size enabled');
                    this.maxFileSize = null;
                }

                // 🔥 Resolve base path (merged logic)
                const template = config.basePathTemplate;

                const context = {
                    organisationId: this.organisationId, // using your getter
                    date: this.getAwsFormattedDate(),       // using your method
                    module: this.moduleName.toLowerCase()
                };

                console.log('📌 Base Path Template:', template);
                console.log('📌 Context Values:', JSON.stringify(context));

                let resolvedPath = template.replace(/{(.*?)}/g, (match, key) => {
                    if (!context[key]) {
                        console.error(` Missing value for placeholder: ${key}`);
                        throw new Error(`Missing value for ${key}`);
                    }
                    return context[key];
                });

                // Normalize slashes
                resolvedPath = resolvedPath
                    .replace(/\/+/g, '/')
                    .replace(/\/$/, '');

                this.basePath = resolvedPath;
                this.isConfigLoaded = true;

                console.log('🚀 Final basePath:', this.basePath);
                console.log('👁️ Final showUI:', this.showUI);
                this.loadExistingFiles();

            })
            .catch(error => {
                console.error('❌ Error loading upload config:', error);
            });
    }


    getAwsFormattedDate() {
        const today = new Date();

        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();

        // year/month/day/dd-mm-yyyy
        return `${year}/${month}/${day}/${day}-${month}-${year}`;
    }
    get shouldRenderComponent() {
    return this.isConfigLoaded && this.showUI;
}

    getFileIconData(fileName) {

        const ext = fileName.split('.').pop()?.toLowerCase();

        const map = {
            pdf:  { icon: 'picture_as_pdf', class: 'pdf' },
            doc:  { icon: 'description', class: 'doc' },
            docx: { icon: 'description', class: 'doc' },
            xls:  { icon: 'grid_on', class: 'excel' },
            xlsx: { icon: 'grid_on', class: 'excel' },
            csv:  { icon: 'grid_on', class: 'excel' },
            png:  { icon: 'image', class: 'image' },
            jpg:  { icon: 'image', class: 'image' },
            jpeg: { icon: 'image', class: 'image' },
            gif:  { icon: 'image', class: 'image' },
            zip:  { icon: 'folder_zip', class: 'zip' },
            rar:  { icon: 'folder_zip', class: 'zip' },
            txt:  { icon: 'notes', class: 'text' }
        };

        return map[ext] || { icon: 'insert_drive_file', class: 'default' };
    }

    handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();

     if(this.isUploadDisabled){

        console.warn(
            'Upload blocked: single file already exists'
        );

        return;
    }

        if (!this.isDragging) {
            console.log('📂 Dragging over upload area');
            this.isDragging = true;
        }
    }

handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('📂 Drag left upload area');
    this.isDragging = false;
}

handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

     if(this.isUploadDisabled){

        this.showToast(
            'Warning',
            'Only one file is allowed',
            'warning'
        );

        return;
    }

    console.log('📥 Files dropped');

    this.isDragging = false;

    const files = [...event.dataTransfer.files];

    console.log('📥 Dropped files:', files.map(f => f.name));

    // 🔥 Reuse existing logic
    this.handleFileSelection({ target: { files } });
}

    // ===== FILE SELECTION + SIZE VALIDATION =====
handleFileSelection(event) {
    console.log('📂 handleFileSelection triggered');

    if(this.isUploadDisabled){

        this.showToast(
            'Warning',
            'Only one file is allowed',
            'warning'
        );

        return;
    }

    const files = [...event.target.files];
    console.log('📥 Files selected:', files.map(f => f.name));

    const resetExisting = !this.allowMultiple;

    if (resetExisting) {
        console.log('⚠️ Single file mode → clearing existing files');
        this.uploadFileList = [];
    }

    const { validFiles, invalidFiles } = this.validateAndPrepareFiles(files, resetExisting);

    this.uploadFileList = validFiles;

    console.log('📋 Final uploadFileList:', this.uploadFileList);

    if (invalidFiles.length) {
        console.warn('⚠️ Invalid files:', invalidFiles);

        const hasCountError = invalidFiles.some(f => f.includes('max file count reached'));
        const hasFormatError = invalidFiles.some(f => f.includes('invalid format'));
        const hasSizeError = invalidFiles.some(f => f.includes('size exceeded'));

        let title = 'Validation Error';
        let message = invalidFiles.join(', ');
        let variant = 'error';

        if (hasCountError && !hasFormatError && !hasSizeError) {
            title = 'Limit Reached';
            message = `Maximum ${this.maxFileCount} files allowed`;
            variant = 'warning';
        } else if (hasSizeError && !hasFormatError && !hasCountError) {
            title = 'File Size Exceeded';
            message = `These files exceed size limit: ${invalidFiles.join(', ')}`;
            variant = 'error';
        }

        this.showToast(title, message, variant);
    }

    if (this.uploadFileList.length && !this.isUploading) {
        console.log('🚀 Triggering auto upload...');
        setTimeout(() => {
            this.handleUpload();
        }, 0);
    } else {
        console.log('⛔ No valid files, skipping upload trigger');
    }
}

showToast(title, message, variant) {
    this.dispatchEvent(
        new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        })
    );
}

get formattedFormats() {
    if (!this.acceptedFormats) return '';

    return this.acceptedFormats
        .split(',')
        .map(f => f.replace('.', '').toUpperCase().trim())
        .join(', ');
}

get formattedMaxSize() {
    if (!this.maxFileSize) return '';

    const bytes = this.maxFileSize;

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

buildFileRequest(files) {
    let base = this.basePath || '';

    if (!base.endsWith('/')) {
        base += '/';
    }

    return files.map(file => ({
        key: `${base}${Date.now()}_${file.name}`,
        contentType: file.type
    }));
}
async uploadToS3(files, urls) {

    const uploadPromises = files.map((fileObj, index) => {

        return new Promise((resolve, reject) => {

            const xhr = new XMLHttpRequest();

            xhr.open('PUT', urls[index], true);

            // 🔥 progress
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);

                    fileObj.progress = percent;
                    fileObj.progressStyle = `width:${percent}%`;

                    this.uploadFileList = [...this.uploadFileList];
                }
            };

            // 🔥 success
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    this.updateFileState(fileObj, 'uploaded');
                    fileObj.progress = 100;
                    fileObj.progressStyle = 'width:100%';
                    resolve();
                } else {
                    this.updateFileState(fileObj, 'error');
                    reject();
                }

                this.uploadFileList = [...this.uploadFileList];
            };

            // 🔥 error
            xhr.onerror = () => {
                this.updateFileState(fileObj, 'error');
                this.uploadFileList = [...this.uploadFileList];
                reject();
            };

            xhr.send(fileObj.file);
        });

    });

    return Promise.all(uploadPromises);
}
refreshFileList() {
    this.uploadFileList = [...this.uploadFileList];
}

getProgressStyle(progress) {
    return `width:${progress}%;`;
}

updateFileState(fileObj, status) {
    fileObj.status = status;

    fileObj.isUploading = (status === 'uploading');
    fileObj.isUploaded = (status === 'uploaded');
    fileObj.isError = (status === 'error');
}

async handleUpload() {

    console.log('🚀 handleUpload START');

    if (!this.uploadFileList.length) {
        console.warn('⚠️ No valid files to upload');
        this.showToast('Warning', 'No valid files to upload', 'warning');
        return;
    }

    if (!this.basePath) {
        console.error('❌ basePath is missing:', this.basePath);
        this.showToast(
            'Configuration Error',
            'Upload path not initialized',
            'error'
        );
        return;
    }

    console.log('📁 Base Path:', this.basePath);
    console.log('📦 Files to upload:', this.uploadFileList);

    this.isUploading = true;
    this.uploadSuccess = false;

    try {
        // 🔥 mark all files as uploading
        console.log('⏳ Marking files as uploading...');
        this.uploadFileList.forEach(f => {
            this.updateFileState(f, 'uploading');
            f.progress = 0;
            f.progressStyle = 'width:0%';
        });

        this.uploadFileList = [...this.uploadFileList];

        // 🔥 Build request
        const fileReq = this.buildFileRequest(this.uploadFileList);
        console.log('📡 File request payload:', fileReq);

        // 🔥 Call Apex
        console.log('📡 Calling Apex uploadFiles...');
        const result = await uploadFiles({ files: fileReq });
        console.log('📥 Apex response received:', result);

        if (!result || !result.files) {
            console.error('❌ Invalid Apex response:', result);
            throw new Error('Invalid response from uploadFiles');
        }

        // 🔥 Attach keys
        console.log('🔑 Mapping S3 keys to files...');
        this.uploadFileList = this.uploadFileList.map((f, index) => ({
            ...f,
            key: result.files[index]?.key
        }));

        const uploadUrls = result.files.map(f => f.uploadUrl);
        console.log('🌐 Upload URLs:', uploadUrls);

        // 🔥 upload with progress
        console.log('⬆️ Uploading files to S3...');
        await this.uploadToS3(this.uploadFileList, uploadUrls);
        console.log('✅ S3 upload completed');

        // 🔥 mark all as uploaded
        console.log('✅ Marking files as uploaded...');
        this.uploadFileList.forEach(f => {
            this.updateFileState(f, 'uploaded');
            f.progress = 100;
            f.progressStyle = 'width:100%';
        });

        this.uploadFileList = [...this.uploadFileList];

        // 🔥 update uploaded list
        this.uploadedFiles = [...this.uploadedFiles, ...result.files];
        console.log('📁 Uploaded files list updated:', this.uploadedFiles);

        const finalResponse = {
            failed: result.failed,
            files: result.files,
            fileUrls: result.fileUrls || [],
            succeeded: result.succeeded,
            total: result.total
        };

        console.log('📊 Dispatching upload result to parent:', finalResponse);

        this.responseText = JSON.stringify(finalResponse, null, 2);

        // 🔥 notify parent

        this.dispatchEvent(new CustomEvent('uploadsuccess', {
            detail: finalResponse
        }));

        this.uploadSuccess = true;
        console.log('🎉 Upload process completed successfully');

    } catch (error) {
        console.error('❌ Upload error occurred:', error);
        console.error('❌ Error details:', this.getError(error));

        this.responseText = 'Upload Error: ' + this.getError(error);
        throw error;
    } finally {
        this.isUploading = false;
        console.log('🔚 handleUpload END');
    }
}


async handleDelete(event) {
    const key = event.currentTarget.dataset.key;

    try {
        const result = await deleteFiles({ keys: [key] });

        // 🔥 remove from uploadFileList
        this.uploadFileList = this.uploadFileList.filter(f => f.key !== key);

        // 🔥 SUCCESS LOG
        console.log('✅ File deleted successfully:', key);

        // 🔥 optional: detailed response log
        console.log('📥 Delete API Response:', result);

        const finalResponse = {
            files: this.uploadFileList
        };

        this.responseText = JSON.stringify(finalResponse, null, 2);

        // 🔥 notify parent
        this.dispatchEvent(new CustomEvent('delete', {
            detail: this.uploadFileList
        }));

    } catch (error) {
        console.error('❌ Delete Error:', error);
        this.responseText = 'Delete Error: ' + this.getError(error);
    }
}
async handleDownload(event){

    try{

        const url =
            event.currentTarget.dataset.url;

        const fileName =
            event.currentTarget.dataset.name;

        console.log(
            'Downloading File:',
            url
        );

        const response =
            await fetch(url);

        const blob =
            await response.blob();

        const blobUrl =
            window.URL.createObjectURL(blob);

        const link =
            document.createElement('a');

        link.href =
            blobUrl;

        link.download =
            fileName;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        window.URL.revokeObjectURL(blobUrl);

        console.log(
            'File downloaded successfully'
        );

    } catch(error){

        console.error(
            'Download Error:',
            error
        );
    }
}

extractKeysFromJson(data, keys = []) {
    if (data === null || data === undefined) {
        return keys;
    }

    if (Array.isArray(data)) {
        data.forEach(item => this.extractKeysFromJson(item, keys));
        return keys;
    }

    if (typeof data === 'object') {
        Object.keys(data).forEach(prop => {
            if (prop === 'key' && typeof data[prop] === 'string' && data[prop].trim()) {
                keys.push(data[prop].trim());
            } else {
                this.extractKeysFromJson(data[prop], keys);
            }
        });
    }

    return keys;
}

@api
async deleteFilesFromAwsJson(awsJsonText) {
    console.log('🗑️ deleteFilesFromAwsJson START');

    try {
        if (!awsJsonText || !awsJsonText.trim()) {
            console.warn('⚠️ No AWS JSON provided for delete');
            return { deletedKeys: [], deletedCount: 0 };
        }

        console.log('🧾 Raw AWS JSON:', awsJsonText);

        const parsed = JSON.parse(awsJsonText);
        console.log('📦 Parsed AWS JSON:', parsed);

        const keys = [...new Set(this.extractKeysFromJson(parsed))];
        console.log('🔑 Extracted keys:', keys);

        if (!keys.length) {
            console.warn('⚠️ No file keys found in AWS JSON');
            return { deletedKeys: [], deletedCount: 0 };
        }

        console.log('📡 Calling Apex deleteFiles with keys:', keys);
        const result = await deleteFiles({ keys });
        console.log('📥 deleteFiles Apex response:', result);

        console.log('🧹 uploadFileList before cleanup:', this.uploadFileList);
        console.log('🧹 uploadedFiles before cleanup:', this.uploadedFiles);

        this.uploadFileList = this.uploadFileList.filter(f => !keys.includes(f.key));
        this.uploadedFiles = this.uploadedFiles.filter(f => !keys.includes(f.key));

        console.log('🧹 uploadFileList after cleanup:', this.uploadFileList);
        console.log('🧹 uploadedFiles after cleanup:', this.uploadedFiles);

        const finalResponse = {
            deletedKeys: keys,
            deletedCount: keys.length,
            apiResponse: result
        };

        console.log('✅ Files deleted successfully from AWS JSON:', finalResponse);

        this.responseText = JSON.stringify(finalResponse, null, 2);
        console.log('📝 responseText updated');

        this.dispatchEvent(new CustomEvent('delete', {
            detail: finalResponse
        }));
        console.log('📤 delete event dispatched to parent');

        return finalResponse;

    } catch (error) {
        console.error('❌ Delete from AWS JSON failed');
        console.error('❌ Error object:', error);
        console.error('❌ Error message:', this.getError(error));

        this.responseText = 'Delete Error: ' + this.getError(error);
        throw error;

    } finally {
        console.log('🔚 deleteFilesFromAwsJson END');
    }
}

@api
async uploadPayload(payload, fileName = 'payload.json', contentType = 'application/json') {
    console.log('📦 uploadPayload invoked from parent');

    if (!this.isConfigLoaded) {
        throw new Error('Upload config is not loaded yet');
    }

    if (!this.basePath) {
        throw new Error('Upload path is not initialized');
    }

    const blob = payload instanceof Blob
        ? payload
        : new Blob([JSON.stringify(payload)], { type: contentType });

    const file = new File([blob], fileName, { type: contentType });

    const resetExisting = !this.allowMultiple;

    if (resetExisting) {
        console.log('⚠️ Single file mode → clearing existing files for hidden upload');
        this.uploadFileList = [];
    }

    const { validFiles, invalidFiles } = this.validateAndPrepareFiles([file], resetExisting);

    if (invalidFiles.length) {
        const errorMessage = invalidFiles.join(', ');
        console.error('❌ Hidden upload validation failed:', errorMessage);
        throw new Error(errorMessage);
    }

    this.uploadFileList = validFiles;

    console.log('📋 uploadFileList prepared for hidden upload:', this.uploadFileList);

    await this.handleUpload();

    return {
        success: true,
        uploadedFiles: this.uploadedFiles,
        responseText: this.responseText
    };
}

    // ===== ERROR HANDLING =====
    getError(error) {
        return error?.body?.message || error.message || JSON.stringify(error);
    }

get uploadBoxClass() {
    let base = 'upload-box';

    if (this.uploadFileList?.length) {
        base += ' active';
    }

    if (this.isDragging) {
        base += ' dragover';
    }

    return base;
}

openFileDialog() {

    if(this.isUploadDisabled){

        this.showToast(
            'Warning',
            'Delete existing file before uploading a new one',
            'warning'
        );

        return;
    }

    this.template
        .querySelector('[data-id="fileInput"]')
        .click();
}

get fileSectionTitle() {
    const allUploaded = this.uploadFileList.length &&
        this.uploadFileList.every(f => f.isUploaded);

    return allUploaded ? 'Uploaded Files' : 'Selected Files';
}

get isUploadDisabled(){

    return (
        !this.allowMultiple &&
        this.uploadFileList &&
        this.uploadFileList.length > 0
    );
}

handleRetry(event) {
    const index = event.currentTarget.dataset.index;
    const file = this.uploadFileList[index];

    console.log('🔁 Retrying file:', file.name);

    this.updateFileState(file, 'pending');
    file.progress = 0;
    file.progressStyle = 'width:0%';

    this.uploadFileList = [...this.uploadFileList];

    this.handleUpload();
}


getAllowedFormats() {
    if (!this.acceptedFormats) return [];

    return this.acceptedFormats
        .split(',')
        .map(f => f.trim().toLowerCase())
        .filter(Boolean);
}

isFileFormatAllowed(file) {
    const allowedFormats = this.getAllowedFormats();

    if (!allowedFormats.length) {
        return true;
    }

    const fileName = file.name?.toLowerCase() || '';
    const fileType = file.type?.toLowerCase() || '';

    return allowedFormats.some(format => {
        if (format.startsWith('.')) {
            return fileName.endsWith(format);
        }
        return fileType === format;
    });
}

buildUploadFileObject(file) {
    const iconData = this.getFileIconData(file.name);

    return {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        sizeFormatted: this.formatFileSize(file.size),
        icon: iconData.icon,
        fullIconClass: `material-icons file-icon ${iconData.class}`,
        status: 'pending',
        progress: 0,
        progressStyle: 'width:0%',
        isUploading: false,
        isUploaded: false,
        isError: false
    };
}

validateAndPrepareFiles(files, resetExisting = false) {
    const invalidFiles = [];
    const existingMap = new Map();

    if (!resetExisting && this.allowMultiple) {
        this.uploadFileList.forEach(f => {
            existingMap.set(f.name, f);
        });
    }

    for (const file of files) {
        console.log(`🔍 Validating file: ${file.name} (${file.size} bytes)`);

        if (!this.isFileFormatAllowed(file)) {
            console.warn(`❌ Invalid file format: ${file.name}`);
            invalidFiles.push(`${file.name} (invalid format)`);
            continue;
        }

        if (!this.isUnlimited && this.maxFileSize && file.size > this.maxFileSize) {
            console.warn(`❌ File too large: ${file.name}`);
            invalidFiles.push(`${file.name} (size exceeded)`);
            continue;
        }

        if (this.allowMultiple && this.maxFileCount && existingMap.size >= this.maxFileCount) {
            console.warn(`⚠️ Max file count (${this.maxFileCount}) reached`);
            invalidFiles.push(`${file.name} (max file count reached)`);
            continue;
        }

        const fileObj = this.buildUploadFileObject(file);

        if (existingMap.has(file.name)) {
            console.log(`♻️ Replacing existing file: ${file.name}`);
        } else {
            console.log(`➕ Adding new file: ${file.name}`);
        }

        existingMap.set(file.name, fileObj);
    }

    return {
        validFiles: Array.from(existingMap.values()),
        invalidFiles
    };
}

async loadExistingFiles() {
    try {
        if (!this.existingFilesJson) {
            console.log('ℹ️ No existing files JSON provided');
            return;
        }

        const parsed =
            typeof this.existingFilesJson === 'string'
                ? JSON.parse(this.existingFilesJson)
                : this.existingFilesJson;

        console.log('📂 Existing Files JSON:', parsed);

        let files = [];

        if (Array.isArray(parsed)) {
            files = parsed;
        } else if (parsed.files) {
            files = parsed.files;
        }

        this.uploadFileList = files.map(file => {

            const fileName = file.key
                ? file.key.split('/').pop()
                : file.name;

            const iconData = this.getFileIconData(fileName);

            return {
                name: fileName,
                key: file.key,
                url: file.url || file.downloadUrl || '',
                sizeFormatted: file.size
                    ? this.formatFileSize(file.size)
                    : '',
                icon: iconData.icon,
                fullIconClass: `material-icons file-icon ${iconData.class}`,

                progress: 100,
                progressStyle: 'width:100%',

                status: 'uploaded',

                isUploading: false,
                isUploaded: true,
                isError: false,

                isExisting: true
            };
        });

        console.log('✅ Existing files loaded:', this.uploadFileList);

    } catch (error) {
        console.error('❌ Error loading existing files:', error);
    }
}

}