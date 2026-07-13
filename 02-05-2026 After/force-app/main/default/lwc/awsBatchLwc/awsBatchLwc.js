import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import uploadFiles from '@salesforce/apex/AwsBatchController.uploadFiles';
import deleteFiles from '@salesforce/apex/AwsBatchController.deleteFiles';

export default class AwsBatchLwc extends LightningElement {

    // ===== PUBLIC API =====
@api basePath;
@api acceptedFormats;
@api maxFileSize;     // NOW in BYTES (from Apex)
@api allowMultiple;
@api maxFileCount;
@api isUnlimited = false;

    // ===== STATE =====
    @track uploadFileList = [];
    @track uploadedFiles = [];
    @track responseText = '';
    @track isDragging = false;



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

    // 🔥 Single file enforcement
    if (!this.allowMultiple) {
        console.log('⚠️ Single file mode → clearing existing files');
        this.uploadFileList = [];
    }

    const files = [...event.target.files];

    console.log('📥 Files selected:', files.map(f => f.name));

    const maxSizeBytes = this.maxFileSize;
    console.log('📏 Max allowed size (bytes):', maxSizeBytes);

    const invalidFiles = [];

    // 🔥 Create a map of existing files (by name)
    const existingMap = new Map();
    this.uploadFileList.forEach(f => {
        existingMap.set(f.name, f);
    });

    files.forEach(file => {

        console.log(`🔍 Processing file: ${file.name} (${file.size} bytes)`);

        // 🔥 Size validation
        if (maxSizeBytes && file.size > maxSizeBytes) {
            console.warn(`❌ File too large: ${file.name}`);
            invalidFiles.push(file.name);
            return;
        }

        // 🔥 Max file count validation
        if (this.allowMultiple && this.maxFileCount &&
            existingMap.size >= this.maxFileCount) {

            console.warn(`⚠️ Max file count (${this.maxFileCount}) reached`);
            this.showToast(
                'Limit Reached',
                `Maximum ${this.maxFileCount} files allowed`,
                'warning'
            );
            return;
        }

        const iconData = this.getFileIconData(file.name);

        const fileObj = {
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

        // 🔥 Replace if same file name exists (existing behavior preserved)
        if (existingMap.has(file.name)) {
            console.log(`♻️ Replacing existing file: ${file.name}`);
        } else {
            console.log(`➕ Adding new file: ${file.name}`);
        }

        existingMap.set(file.name, fileObj);
    });

    // 🔥 Convert back to array
    this.uploadFileList = Array.from(existingMap.values());

    console.log('📋 Final uploadFileList:', this.uploadFileList);

    // 🔥 Show validation message
    if (invalidFiles.length) {
        console.warn('⚠️ Invalid files:', invalidFiles);
       this.showToast(
            'File Size Exceeded',
            `These files exceed size limit: ${invalidFiles.join(', ')}`,
            'error'
        );
    }

    // 🔥 Auto upload ONLY if valid files exist
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
    this.template.querySelector('[data-id="fileInput"]').click();
}

get fileSectionTitle() {
    const allUploaded = this.uploadFileList.length &&
        this.uploadFileList.every(f => f.isUploaded);

    return allUploaded ? 'Uploaded Files' : 'Selected Files';
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


}