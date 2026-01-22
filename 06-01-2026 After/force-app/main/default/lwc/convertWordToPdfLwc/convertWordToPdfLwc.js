import { LightningElement, track, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import SPARK from '@salesforce/resourceUrl/Spark';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


// ========= TUNABLES =========
const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
const ENDPOINTS = {
  upload: `${AWS_BASE}/worddoc-to-pdf-chunks`,
  status: (fileId) => `${AWS_BASE}/worddoc-to-pdf-status/${encodeURIComponent(fileId)}`,
  generate: `${AWS_BASE}/generate-files`,
  delete:  `${AWS_BASE}/delete-file`
};
const BYTES_MB = 1024 * 1024;
const PAYLOAD_CAP_BYTES = 5 * BYTES_MB;
const CHUNK_BYTES = Math.floor(3.5 * BYTES_MB);

const CHECKSUM_PREFERENCE = 'MD5_BYTES_B64';

// ---- small helpers (module scope) ----
function hexFromArrayBuffer(buf) {
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
function b64FromUint8(u8) {
  let bin = '';
  const step = 0x8000;
  for (let i = 0; i < u8.length; i += step) {
    bin += String.fromCharCode.apply(null, u8.subarray(i, i + step));
  }
  return btoa(bin);
}
function hexToUint8(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map(h => parseInt(h, 16)));
}
// Accept either folder values or the canonical keys
const VALID_MODULE_KEYS = new Set(['staff', 'hr', 'profile', 'facility', 'ticket']);
const MODULE_KEY_BY_FOLDER = {
  'Staff_Documentation/': 'staff',
  'HR_Documentation/': 'hr',
  'Profile_Documentation/': 'profile',
  'Facility_Documentation/': 'facility',
  'Ticket_Documentation/': 'ticket'
};
 // 10 MB per selection action
const MAX_SELECTION_BYTES = 15 * 1024 * 1024;

export default class ConvertWordToPdfLwc extends LightningElement {

    // ====== New: external control via @api ======
  _incomingFiles = [];
  _modulePathFromParent = '';
  _confirmUpload = false;
  _libsPromise;

  /** Parent passes File[] or FileList */
  @api set incomingFiles(value) {
    // only replace the queue when parent sends a new set
    const files = value instanceof FileList ? Array.from(value) : Array.isArray(value) ? value : [];
    console.log('files',JSON.stringify(files));
    this.ingestFilesFromParent(files);
    // do not auto-start; wait for confirmUpload=true
    this._checkAndStart();
  }
  get incomingFiles() { return this._incomingFiles; }

  /** Parent passes 'staff' | 'hr' | 'profile' | 'facility' | 'ticket' OR folder path key */
  @api set modulePathFromParent(value) {
    this._modulePathFromParent = value || '';
    this.modulePath = value || ''; // keep existing code path working
    this._checkAndStart();
  }
  get modulePathFromParent() { return this._modulePathFromParent; }

  /** Parent sets true to actually start upload of the currently queued files */
  @api set confirmUpload(value) {
    this._confirmUpload = !!value;
    this._checkAndStart();
  }
  get confirmUpload() { return this._confirmUpload; }

  /** Optional: allow parent to reset/clear the queue */
  @api resetQueue() {
    this.files = [];
    this._uploadResults = [];
    this._apiBatches = [];
    this._confirmUpload = false;
  }







bytesToMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

// tracking for summary
_apiBatches = []; // [{ bodyLen, mb, segmentsSummary }]
_uploadResults = []; // array of per-file metadata across all batches (enriched with recordId)


  @api recordId;
  @track files = []; // [{ file, fileId, totalBytes, uploadedBytes, totalParts, progress, status, url }]
  @track generateResult;

 libsLoaded = false;

 @track modulePath = ''; // 'staff' | 'hr' | 'profile' | 'facility' | 'ticket'

folders = [
  { label: 'Staff Documentation', value: 'staff' },
  { label: 'HR Documentation', value: 'hr' },
  { label: 'Profile Documentation', value: 'profile' },
  { label: 'Facility Documentation', value: 'facility' },
  { label: 'Ticket Documentation', value: 'ticket' }
];
get folderOptions() { return this.folders; }
handleModulePathChange(e) { this.modulePath = e.detail.value; }


handleModulePathChange(e) {
  this.modulePath = e.detail.value;   // stores the folder path (value)
  console.log('[UI] modulePath set:', this.modulePath);
}

// returns a valid modulePath key or ''
getModulePathKey() {
  const mp = this.modulePath || '';
  if (VALID_MODULE_KEYS.has(mp)) return mp;                     // already a key (good)
  if (MODULE_KEY_BY_FOLDER[mp]) return MODULE_KEY_BY_FOLDER[mp]; // folder -> key
  return ''; // invalid/empty
}


      ensureLibs() {
    if (this._libsPromise) return this._libsPromise;
    this._libsPromise = loadScript(this, SPARK)
      .then(() => { this.libsLoaded = true; console.log('[BOOT] SparkMD5 loaded:', !!window.SparkMD5); })
      .catch(err => { this.libsLoaded = false; console.warn('[BOOT] SparkMD5 failed to load (fallback to SHA-256)', err); });
    return this._libsPromise;
  }

  // Keep renderedCallback harmless; parent may trigger confirm immediately
  renderedCallback() {
    if (!this.libsLoaded && !this._libsPromise) {
      this.ensureLibs().catch(() => {});
    }
  }

    async computeMd5Base64(arrayBuffer) {
        // Use SparkMD5 on ArrayBuffer
        const spark = new window.SparkMD5.ArrayBuffer();
        spark.append(arrayBuffer);
        const md5Hex = spark.end();

        // Convert hex -> bytes -> base64
        const bytes = new Uint8Array(md5Hex.match(/.{1,2}/g).map(h => parseInt(h, 16)));
        let bin = '';
        for (let i = 0; i < bytes.length; i++) {
            bin += String.fromCharCode(bytes[i]);
        }
        return btoa(bin);
    }

  // ---------- UI helpers ----------
  get disableUpload() {
    return this.files.length === 0 || this.files.some(f => f.status === 'uploading');
  }
  get disableGenerate() {
    return this.files.length === 0 || this.files.some(f => !(f.status === 'uploaded' || f.status === 'completed'));
  }

  // ---------- Events ----------
toast(title, message, variant = 'warning') {
  this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
}


handleFileSelect(evt) {
   this.ensureRecordId();
  const picked = Array.from(evt.target.files || []);
  console.log('[UI] files selected:', picked.map(f => ({ name: f.name, size: f.size, type: f.type })));

  // 1) Drop any single file > 10MB with a toast per file
  const validSingles = [];
  const tooBigSingles = [];
  for (const f of picked) {
    if (f.size > MAX_SELECTION_BYTES) {
      tooBigSingles.push(f);
    } else {
      validSingles.push(f);
    }
  }
  if (tooBigSingles.length) {
    const names = tooBigSingles.map(f => `${f.name} (${this.humanFileSize(f.size)})`).join(', ');
    this.toast('File too large', `Skipped: ${names}. Limit is 10 MB per file.`, 'error');
    this.dispatchEvent(
      new CustomEvent('cancel', {
        detail: {
          message: 'hello'
         
        },
        bubbles: true,
        composed: true
      })
    );
  }

  // 2) From the remaining, keep files in order until total <= 10MB
  const accepted = [];
  const skippedForTotal = [];
  let total = 0;
  for (const f of validSingles) {
    if (total + f.size <= MAX_SELECTION_BYTES) {
      accepted.push(f);
      total += f.size;
    } else {
      skippedForTotal.push(f);
    }
  }
  if (skippedForTotal.length) {
    const names = skippedForTotal.map(f => `${f.name} (${this.humanFileSize(f.size)})`).join(', ');
    this.toast('Selection limit reached', `Added ${accepted.length} file(s) up to 10 MB. Skipped: ${names}`, 'warning');
  }

  // 3) Map accepted files to your queue shape; do NOT touch existing ones
  const newOnes = accepted.map(file => ({
    file,
    fileId: this.uuid(),
    totalBytes: file.size,
    uploadedBytes: 0,
    totalParts: Math.ceil(file.size / CHUNK_BYTES),
    progress: 0,
    status: 'pending',
    url: null
  }));

  this.files = [...this.files, ...newOnes].map(f => ({ ...f, humanSize: this.humanFileSize(f.totalBytes) }));
  console.log('[STATE] queue initialized/updated:', JSON.parse(JSON.stringify(this.files)));

  this.showConfirm = this.files.length > 0; 

}


  handleRecordIdChange(e) {
    this.recordId = e.target.value;
    console.log('[UI] recordId set:', this.recordId);
  }

  _upsertIndex = new Map();

upsertResult(meta) {
  const id = meta.fileId;
  const prev = this._upsertIndex.get(id) || {};
  // prefer newer non-null values
  const merged = { ...prev, ...meta };
  if (prev.key && !merged.key) merged.key = prev.key;
  if (prev.url && !merged.url) merged.url = prev.url;
  if (prev.originalName && !merged.originalName) merged.originalName = prev.originalName;
  if (prev.type && !merged.type) merged.type = prev.type;
  if (prev.modulePath && !merged.modulePath) merged.modulePath = prev.modulePath;
  this._upsertIndex.set(id, merged);
  this._uploadResults.push(merged); // optional, for debugging history
}


async startUpload() {
  if (this._uploading) { console.log('[GUARD] already uploading'); return; }
  this.ensureRecordId(); 
  this._uploading = true;
  this._apiBatches = []; // reset per run
  this._upsertIndex = new Map();
this._uploadResults = [];



  try {
    if (!this.files || this.files.length === 0) {
      console.log('[ACTION] startUpload() skipped – no files');
      return;
    }

    console.log('[ACTION] startUpload() with', this.files.length, 'file(s)');

    // Log each file size in MB
    this.files.forEach(f => {
      console.log(`[PLAN] file size: ${f.file.name} = ${this.bytesToMB(f.totalBytes)} MB (${f.totalBytes} bytes)`);
    });

    

    // Build all segments (no network yet)
    const allSegments = [];
    // Track which files are multipart so we can poll after uploads
    const multiPartIds = new Set();

    for (const f of this.files) {
      if (f.status === 'uploaded' || f.status === 'completed') {
        console.log(`[SKIP] ${f.file.name} already ${f.status}`);
        continue;
      }
      f.status = 'uploading';
      this.files = [...this.files];

      console.log(`[PLAN] building segments for ${f.file.name} (${f.totalBytes} bytes) fileId=${f.fileId}`);
      const segs = await this.buildSegmentsForFile(f);
      allSegments.push(...segs);

      // detect if this file is multipart from its computed totalParts (or any seg’s totalParts)
      const tp = f.totalParts || (segs.length ? segs[0].totalParts : 1);
      if (tp > 1) multiPartIds.add(f.fileId);
    }

    // Batch under ~5MB and flush
    let batch = [];
    for (const seg of allSegments) {
      const testBody = JSON.stringify({
                  recordId: this.recordId,
                  modulePath: this.getModulePathKey(),
                  segments: [...batch, seg]
                });

      if (testBody.length > PAYLOAD_CAP_BYTES && batch.length > 0) {
        await this.flushBatch(batch); // records stats inside
        batch = [seg];
      } else if (testBody.length > PAYLOAD_CAP_BYTES) {
        await this.flushBatch([seg]);
        batch = [];
      } else {
        batch.push(seg);
      }
    }
    if (batch.length) await this.flushBatch(batch);

    // Post-upload state handling
    // 1) Single-part files can be marked uploaded now (unless already 'completed' from flush return)
    for (const f of this.files) {
      if (!multiPartIds.has(f.fileId) && f.status !== 'completed') {
        f.status = 'uploaded';
        f.progress = 100;
      }
    }
    this.files = [...this.files];
    this.dispatchOverallProgress();

    // 2) Multipart files: poll /file-status until complete (idempotent finalize)
    //    Skip polling any fileId that already has a URL (server returned in /upload-chunks)
    const needPolling = this.files
      .filter(f => multiPartIds.has(f.fileId) && !f.url)
      .map(f => f.fileId);

    const pollOnce = async (fid) => {
      const url = ENDPOINTS.status(fid);
      try {
        const r = await fetch(url, { method: 'GET' });
        const t = await r.text();
        console.log('[POLL]', fid, r.status, r.statusText, t);

        // Treat 404 as benign: many servers delete the temp state after finalization
        if (r.status === 404) {
          let j; try { j = JSON.parse(t); } catch { j = null; }
          // If the service explicitly says "not_found", we consider it finalized/cleaned up
          if (j && (j.status === 'not_found' || /No upload found/i.test(j.message || ''))) {
            return { status: 'unknown_or_finalized' };
          }
          return { status: 'unknown_or_finalized' };
        }

        if (!r.ok) throw new Error(`/file-status failed ${r.status}: ${t}`);
        let j; try { j = JSON.parse(t); } catch { j = null; }
        return j || { status: 'unknown' };
      } catch (e) {
        console.warn('[POLL] error for', fid, e);
        return { status: 'error' };
      }
    };

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    for (const fid of needPolling) {
      console.log('[FINALIZE] polling status for', fid);

      // if a previous flush gave us the URL in the meantime, skip
      const idxPre = this.files.findIndex(f => f.fileId === fid);
      if (idxPre >= 0 && this.files[idxPre].url) {
        console.log('[FINALIZE] skip polling; URL already present for', fid);
        continue;
      }

      let done = false, urlFound = null;

      for (let i = 1; i <= 15; i++) {
        const j = await pollOnce(fid);
        const st = j?.status || 'unknown';

        if (st === 'complete' || st === 'finalized' || j?.url) {
          done = true;
          urlFound = j?.url || null;
          break;
        }
        if (st === 'unknown_or_finalized') {
          // server cleaned up the state; treat as finalized
          done = true;
          break;
        }

        await sleep(1000);
      }

      const idx = this.files.findIndex(f => f.fileId === fid);
      if (idx >= 0) {
        const row = { ...this.files[idx] };
        if (done) {
          row.status = 'completed';
          row.progress = 100;
          if (urlFound) row.url = urlFound;
        } else {
          console.warn('[POLL] gave up waiting for', fid);
          // keep as 'uploaded' so user can manually recheck
          row.status = 'uploaded';
          row.progress = Math.max(99, row.progress || 99);
        }
        this.files.splice(idx, 1, row);
        this.files = [...this.files];
        
      }
    }

    // Summary
    const totalCalls = this._apiBatches.length || 0;
    console.log(`[SUMMARY] API calls made: ${totalCalls}`);
    this._apiBatches.forEach((b, i) => {
      console.log(
        `[SUMMARY] Call #${i + 1}: payload ${this.bytesToMB(b.bodyLen)} MB (${b.bodyLen} bytes) | segments:`,
        b.segmentsSummary
      );
    });

    console.log('[DONE] cross-file batching complete');

       // Build a clean, deduped final summary (LAST occurrence wins)
const seen = new Set();
const finalFiles = [];
// for (let i = this._uploadResults.length - 1; i >= 0; i--) {
//   const item = this._uploadResults[i];
//   if (!seen.has(item.fileId)) {
//     seen.add(item.fileId);
//     finalFiles.push(item);
//   }
// }
for (let i = this._uploadResults.length - 1; i >= 0; i--) {
  const item = this._uploadResults[i];
  if (!seen.has(item.fileId)) {
    const fromQueue = this.files.find(f => f.fileId === item.fileId);
    const totalBytes = fromQueue?.totalBytes || 0;
    const humanSize = fromQueue?.humanSize || this.humanFileSize(fromQueue?.totalBytes || 0);
    
    finalFiles.push({
      ...item,
      size: humanSize,
      totalBytes: totalBytes,
    });

    seen.add(item.fileId);
  }
}

// this.files = this.files.map(f => ({
//   ...f,
//   humanSize: f.humanSize || this.humanFileSize(f.totalBytes || 0)
// }));
  console.log('[INFO] Human-readable file sizes:');
  this.files.forEach(f => {
    console.log(`- ${f.file?.name || 'Unknown'}: ${f.humanSize}`);
  });
        // Also reflect anything that ended up completed but didn’t flow through uploadedFiles
        for (const f of this.files) {
          if (!seen.has(f.fileId) && (f.status === 'completed' || f.url)) {
            finalFiles.push({
              fileId: f.fileId,
              url: f.url || null,
              key: f.key || null,
              type: f.file?.type || null,
              originalName: f.file?.name || null,
              modulePath: this.getModulePathKey() || null,
              recordId: f.recordId || this.recordId
              
            });
            seen.add(f.fileId);
          }
        }
console.log('[DEBUG] Final files:', finalFiles);
        // Final log/return object
const finalPayload = {
  recordId: this.recordId,
  files: finalFiles,
  ctx: this.contextCellId  
};

console.log('[RESULT] Upload result:', finalPayload);

// NEW: notify (no-op if nobody listens)
this.dispatchEvent(new CustomEvent('uploadcomplete', { detail: finalPayload }));

// NEW: also return for imperative callers; harmless if ignored
return finalPayload;


  } catch (e) {
    console.error('[ERROR] startUpload planner failed', e);
  } finally {
    this._uploading = false;
  }
}


async buildSegmentsForFile(fileEntry) {
  const { file, fileId } = fileEntry;
  const totalParts = Math.ceil(file.size / CHUNK_BYTES);
  let partNumber = 1;
  let start = 0;
  const segments = [];

  while (start < file.size) {
    const end = Math.min(start + CHUNK_BYTES, file.size);
    const blob = file.slice(start, end);
    console.log(`[PART] preparing part ${partNumber}/${totalParts} for ${file.name} bytes [${start}, ${end})`);

    const arrBuf = await blob.arrayBuffer();
    const base64 = await this.arrayBufferToBase64(arrBuf);

    // MD5 of RAW BYTES -> HEX (this is what your server accepted)
    const spark = new window.SparkMD5.ArrayBuffer();
    spark.append(arrBuf);
    const md5Hex = spark.end();
    console.log('[CHECKSUM] using MD5 HEX:', md5Hex);

    segments.push({
      fileId,
      partNumber,                   // << server-friendly
      part: partNumber,
      complete: (partNumber === totalParts),
      totalParts,
      data: base64,
      checksum: md5Hex,             // << MD5 hex
      fileName: file.name,
      fileType: file.type
    });

    // Progress UI for this file (no network yet)
    start = end;
    partNumber++;
    fileEntry.uploadedBytes = end;
    fileEntry.progress = Math.min(99, Math.floor((fileEntry.uploadedBytes / fileEntry.totalBytes) * 100));
    fileEntry.status = 'uploading';
    this.files = [...this.files];
    this.dispatchOverallProgress();
  }

  return segments;
}

dispatchOverallProgress() {
  try {
    const totals = this.files.reduce((acc, f) => {
      acc.total += f.totalBytes || 0;
      acc.sent  += Math.min(f.uploadedBytes || 0, f.totalBytes || 0);
      // treat completed files as fully sent
      if ((f.status === 'uploaded' || f.status === 'completed') && f.totalBytes) {
        acc.sent = Math.max(acc.sent, f.totalBytes);
      }
      return acc;
    }, { total: 0, sent: 0 });
    const pct = totals.total ? Math.round((totals.sent / totals.total) * 100) : 0;
    this.dispatchEvent(new CustomEvent('uploadprogress', { detail: { overallPercent: pct } }));
  } catch {}
}




// Prefer MD5 over the Base64 TEXT you actually send; if SparkMD5 missing, fall back.
md5Base64OfBase64Text(base64Text) {
  if (!window.SparkMD5 || !window.SparkMD5.ArrayBuffer) return null;
  const enc = new TextEncoder();
  const buf = enc.encode(base64Text).buffer;     // bytes of the Base64 string
  const spark = new window.SparkMD5.ArrayBuffer();
  spark.append(buf);
  const md5Hex = spark.end();                    // hex digest
  const bytes = new Uint8Array(md5Hex.match(/.{1,2}/g).map(h => parseInt(h, 16)));
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);                               // MD5 in Base64
}

// Unified checksum chooser used by uploadOneFile
async computeChunkChecksum({ base64Text, bytesBuffer }) {
  // 1) MD5 of the Base64 TEXT (matches many custom servers)
  const md5OfText = this.md5Base64OfBase64Text(base64Text);
  if (md5OfText) {
    console.log('[CKSUM] using MD5(Base64Text)->Base64:', md5OfText);
    return { value: md5OfText, algo: 'MD5' };
  }
  // 2) MD5 of BYTES (Base64) if SparkMD5 is available (your older behavior)
  if (window.SparkMD5 && window.SparkMD5.ArrayBuffer) {
    const spark = new window.SparkMD5.ArrayBuffer();
    spark.append(bytesBuffer);
    const md5Hex = spark.end();
    const bytes = new Uint8Array(md5Hex.match(/.{1,2}/g).map(h => parseInt(h, 16)));
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const md5B64 = btoa(bin);
    console.log('[CKSUM] using MD5(Bytes)->Base64:', md5B64);
    return { value: md5B64, algo: 'MD5' };
  }
  // 3) Fallback: SHA-256 of BYTES (Base64)
  const shaB64 = await this.sha256Base64(bytesBuffer);
  console.log('[CKSUM] fallback SHA-256(Bytes)->Base64:', shaB64);
  return { value: shaB64, algo: 'SHA-256' };
}
// MD5 over BYTES -> HEX
md5HexOfBytes(arrayBuffer) {
  const spark = new window.SparkMD5.ArrayBuffer();
  spark.append(arrayBuffer);
  return spark.end(); // hex
}

// MD5 over BYTES -> Base64
md5Base64OfBytes(arrayBuffer) {
  const hex = this.md5HexOfBytes(arrayBuffer);
  const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(h => parseInt(h, 16)));
  let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// MD5 over the Base64 TEXT you send -> Base64
md5Base64OfBase64Text(base64Text) {
  const enc = new TextEncoder();
  const buf = enc.encode(base64Text).buffer;
  const spark = new window.SparkMD5.ArrayBuffer();
  spark.append(buf);
  const hex = spark.end();
  const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(h => parseInt(h, 16)));
  let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}


async uploadOneFile(fileEntry) {
  const { file, fileId, totalParts } = fileEntry;
  let partNumber = 1;
  let start = 0;

  let batch = [];
  let batchLen = 0;

  while (start < file.size) {
    const end = Math.min(start + CHUNK_BYTES, file.size);
    const blob = file.slice(start, end);
    console.log(`[PART] preparing part ${partNumber}/${totalParts} for ${file.name} bytes [${start}, ${end})`);

    const arrBuf = await blob.arrayBuffer();
    const base64 = await this.arrayBufferToBase64(arrBuf);

    // ---- STRICT: MD5 of RAW BYTES, LOWERCASE HEX in `checksum`
    const spark = new window.SparkMD5.ArrayBuffer();
    spark.append(arrBuf);
    const md5Hex = spark.end(); // 32-char lowercase hex
    console.log('[CHECKSUM] using MD5 HEX:', md5Hex);

    const complete = (partNumber === totalParts);

    // ---- STRICT segment: only the keys many servers expect ----
    const segment = {
      fileId,
      partNumber,          // << use partNumber (not part)
      complete,
      totalParts,
      data: base64,
      checksum: md5Hex,    // << MD5 hex here
      fileName: file.name, // keep these if backend stores metadata
      fileType: file.type
    };

    const testBody = JSON.stringify({ recordId: this.recordId, segments: [...batch, segment] });
    console.log(`[BATCH] test add seg (part ${partNumber}) -> JSON length = ${testBody.length} bytes`);

    if (testBody.length > PAYLOAD_CAP_BYTES && batch.length > 0) {
      console.log(`[BATCH] FLUSH current batch (${batch.length} segs) before adding part ${partNumber}`);
      await this.flushBatch(batch);
      batch = [segment];
      batchLen = JSON.stringify({ recordId: this.recordId, segments: batch }).length;
      console.log(`[BATCH] new batch started with part ${partNumber}; JSON length = ${batchLen}`);
    } else if (testBody.length > PAYLOAD_CAP_BYTES) {
      console.warn(`[WARN] single segment exceeds cap; sending alone (length=${testBody.length})`);
      await this.flushBatch([segment]);
      batch = [];
      batchLen = 0;
    } else {
      batch = [...batch, segment];
      batchLen = testBody.length;
    }

    // Progress
    start = end;
    partNumber++;
    fileEntry.uploadedBytes = end;
    fileEntry.progress = Math.min(99, Math.floor((fileEntry.uploadedBytes / fileEntry.totalBytes) * 100));
    this.files = [...this.files];
    console.log(`[PROGRESS] ${file.name}: ${fileEntry.progress}% (${fileEntry.uploadedBytes}/${fileEntry.totalBytes})`);
  }

  if (batch.length > 0) {
    console.log(`[BATCH] final FLUSH with ${batch.length} segment(s) for ${file.name}`);
    await this.flushBatch(batch);
  }
}

async pollStatusUntilUrl(fileId, { tries = 12, intervalMs = 1000 } = {}) {
  for (let i = 1; i <= tries; i++) {
    const url = `${ENDPOINTS.status(fileId)}`;
    console.log(`[POLL] (${i}/${tries}) GET ${url}`);
    try {
      const resp = await fetch(url);
      const text = await resp.text();
      console.log('[POLL] status:', resp.status, resp.statusText, 'body:', text);
      if (resp.ok) {
        let json; try { json = JSON.parse(text); } catch { json = null; }
        if (json && (json.status === 'complete' || json.status === 'finalized') && json.url) {
          console.log('[POLL] finalized with URL:', json.url);
          return json.url;
        }
      }
    } catch (e) {
      console.warn('[POLL] error', e);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  console.warn('[POLL] gave up waiting for', fileId);
  return null;
}

async flushBatch(segments) {

const body = JSON.stringify({ recordId: this.recordId, modulePath: this.getModulePathKey(), segments });

  const bodyLen = new TextEncoder().encode(body).length;

  // Compact segment summary for logs & later summary
  const segmentsSummary = segments.map(s => ({
    fileId: s.fileId,
    partNumber: s.partNumber ?? s.part,
    complete: !!s.complete,
    totalParts: s.totalParts ?? 1,
    dataLen: (s.data && s.data.length) || 0
  }));

  console.log(
    '[HTTP] POST /upload-chunks payload bytes:',
    bodyLen,
    `≈ ${(bodyLen / (1024 * 1024)).toFixed(2)} MB`,
    'segments:',
    segmentsSummary
  );

  // Record this batch so startUpload() can print totals
  if (!Array.isArray(this._apiBatches)) this._apiBatches = [];
  this._apiBatches.push({ bodyLen, segmentsSummary });

  try {
    const resp = await fetch(ENDPOINTS.upload, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    console.log('[HTTP] /upload-chunks status:', resp.status, resp.statusText);
    const text = await resp.text();
    console.log('[HTTP] /upload-chunks raw body:', text);
    if (!resp.ok) throw new Error(`Upload failed ${resp.status} ${resp.statusText}: ${text}`);

    let json; try { json = JSON.parse(text); } catch { json = null; }
    console.log('[HTTP] /upload-chunks parsed JSON:', json);

    // --- Apply URLs from completedFiles (map of fileId -> url) ---
if (json && json.completedFiles) {
  for (const [fid, url] of Object.entries(json.completedFiles)) {
    const idx = this.files.findIndex(f => f.fileId === fid);
    if (idx >= 0) {
      const row = { ...this.files[idx] };
      row.url = url || row.url;
      row.status = 'completed';
      row.progress = 100;
      row.recordId = this.recordId; 
      this.normalizeRow(row);                 // <-- add
      this.files.splice(idx, 1, row);
    }
    this.upsertResult({
  fileId: fid,
  url,
  recordId: this.recordId,
  key: this.files[idx]?.key || null,
  originalName: this.files[idx]?.file?.name || null,
  type: this.files[idx]?.file?.type || null,
  modulePath: this.getModulePathKey() || null
});
  }
  this.files = [...this.files];
  this.dispatchOverallProgress();
}

// --- Also apply URLs/KEYS from uploadedFiles (array of objects) ---
if (json && Array.isArray(json.uploadedFiles)) {
  for (const uf of json.uploadedFiles) {
    const idx = this.files.findIndex(f => f.fileId === uf.fileId);
    if (idx >= 0) {
      const row = { ...this.files[idx] };
      row.url = uf.url || row.url;
      if (uf.key) row.key = uf.key;          // <-- keep S3 key for delete
      if (row.url) {
        row.status = 'completed';
        row.progress = 100;
      }
       row.recordId = this.recordId;
      this.normalizeRow(row);                 // <-- add
      this.files.splice(idx, 1, row);
    }
    this.upsertResult({
  fileId: uf.fileId,
  url: uf.url || null,
  key: uf.key || null,
  type: uf.type || this.files[idx]?.file?.type || null,
  originalName: uf.originalName || this.files[idx]?.file?.name || null,
  modulePath: uf.modulePath || this.getModulePathKey() || null,
  recordId: this.recordId
});
  }
  this.files = [...this.files];
  this.dispatchOverallProgress();
}



    return json;
  } catch (e) {
    console.error('[HTTP-ERROR] /upload-chunks failed', e);
    throw e;
  }
}





  async checkOne(e) {
    const fileId = e.currentTarget.dataset.fileid;
    console.log('[ACTION] check status for', fileId);

    try {
      const url = ENDPOINTS.status(fileId);
      console.log('[HTTP] GET', url);
      const resp = await fetch(url, { method: 'GET' });
      const text = await resp.text();
      console.log('[HTTP] /file-status status:', resp.status, resp.statusText, 'body:', text);
      if (!resp.ok) throw new Error(`/file-status failed ${resp.status}: ${text}`);

      let json; try { json = JSON.parse(text); } catch { json = null; }
      const idx = this.files.findIndex(f => f.fileId === fileId);
      if (idx >= 0) {
        const f = { ...this.files[idx] };
        if (json && (json.status === 'complete' || json.status === 'finalized')) {
          f.status = 'completed';
          f.progress = 100;
          if (json.url) f.url = json.url;
        } else {
          f.status = `status: ${json && json.status ? json.status : 'unknown'}`;
        }
        this.files.splice(idx, 1, f);
        this.files = [...this.files];
      }
    } catch (err) {
      console.error('[HTTP-ERROR] /file-status failed', err);
    }
  }

  async generate() {
    const fileIds = this.files.map(f => f.fileId);
const body = JSON.stringify({ recordId: this.recordId, modulePath: this.getModulePathKey(), fileIds }); // <-- ADD modulePath

    console.log('[ACTION] generate files for', fileIds);
    console.log('[HTTP] POST /generate-files payload bytes:', body.length, 'body:', body);

    try {
      const resp = await fetch(ENDPOINTS.generate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      const text = await resp.text();
      console.log('[HTTP] /generate-files status:', resp.status, resp.statusText, 'body:', text);
      if (!resp.ok) throw new Error(`/generate-files failed ${resp.status}: ${text}`);

      let json; try { json = JSON.parse(text); } catch { json = null; }
      this.generateResult = json;

      if (json) {
        for (const f of this.files) {
          if (json[f.fileId]) {
            f.url = json[f.fileId];
            f.status = 'completed';
            f.progress = 100;
          }
        }
        this.files = [...this.files];
      }
    } catch (err) {
      console.error('[HTTP-ERROR] /generate-files failed', err);
    }
  }

  // ---------- utils ----------
  humanFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B','KB','MB','GB','TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  uuid() {
    // RFC4122-ish
    const rnd = crypto.getRandomValues(new Uint8Array(16));
    rnd[6] = (rnd[6] & 0x0f) | 0x40;
    rnd[8] = (rnd[8] & 0x3f) | 0x80;
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `${toHex(rnd[0])}${toHex(rnd[1])}${toHex(rnd[2])}${toHex(rnd[3])}-${toHex(rnd[4])}${toHex(rnd[5])}-${toHex(rnd[6])}${toHex(rnd[7])}-${toHex(rnd[8])}${toHex(rnd[9])}-${toHex(rnd[10])}${toHex(rnd[11])}${toHex(rnd[12])}${toHex(rnd[13])}${toHex(rnd[14])}${toHex(rnd[15])}`;
  }

  async arrayBufferToBase64(buffer) {
    const chunkSize = 0x8000; // 32KB
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const sub = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, sub);
    }
    const b64 = btoa(binary);
    console.log('[UTIL] arrayBufferToBase64 -> length:', b64.length);
    return b64;
  }

  async sha256Base64(buffer) {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    const out = b64FromUint8(new Uint8Array(hash));
    console.log('[UTIL] sha256Base64 ->', out);
    return out;
  }


// Helper: derive key if not present (parses from URL path)
getKeyForFile(f) {
  if (f.key) return f.key;
  try {
    if (!f.url) return null;
    const u = new URL(f.url);
    return decodeURIComponent(u.pathname.replace(/^\/+/, '')); // strip leading '/'
  } catch {
    return null;
  }
}

// DELETE with visible progress (uploaded) OR just remove locally (not uploaded)
async deleteOne(evt) {
  evt.preventDefault();
  console.log('[DELETE] deleteOne called ');
  console.log('this.files in deleteOne :  ' , JSON.stringify(this.files));
  const fileId = evt.currentTarget?.dataset?.fileid;
  const i = this.files.findIndex(x => x.fileId === fileId);
  if (i === -1) return;

  // If not uploaded yet (no key AND no url) -> remove from selection immediately
  const current = this.files[i];
  const hasUrl = !!current.url;
  const hasKeyProp = !!current.key;
  
  if (!hasUrl && !hasKeyProp) {
    // Remove from selected array
    const next = this.files.filter(x => x.fileId !== fileId);
    this.files = next;
    console.log('[DELETE] removed from selection (not uploaded):', fileId);
    return;
  }
  // ===== Uploaded path (has key or URL) -> keep existing progress + server delete =====
  const files = [...this.files];
  const row = { ...files[i] };

  const key = this.getKeyForFile(row);
  if (!key) {
    // If somehow we had a url/key earlier but now can't derive key, just bail quietly
    console.warn('[DELETE] missing key for fileId', fileId);
    return;
  }
  
  // init delete progress state
  row.deleting = true;
  row.deleteProgress = 5;
  files[i] = row;
  this.files = files;

  // soft progress ticker to ~90% while waiting
  let ticker = setInterval(() => {
    const fidx = this.files.findIndex(x => x.fileId === fileId);
    if (fidx === -1) return;
    const fr = { ...this.files[fidx] };
    fr.deleteProgress = Math.min((fr.deleteProgress || 0) + 5, 90);
    const next = [...this.files];
    next[fidx] = fr;
    this.files = next;
  }, 150);
  
  try {
    const resp = await fetch(ENDPOINTS.delete, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    const text = await resp.text();
    let json; try { json = JSON.parse(text); } catch { json = null; }
    if (!resp.ok) throw new Error(json?.error || `Delete failed ${resp.status}: ${text}`);

    clearInterval(ticker);
    // const doneList = [...this.files];
    // const j = doneList.findIndex(x => x.fileId === fileId);
    // if (j !== -1) {
    //   const done = { ...doneList[j] };
    //   done.deleting = false;
    //   done.deleteProgress = 100;
    //   done.status = 'deleted';
    //   done.url = null;
    //   done.key = null;
    //   doneList[j] = done;
    //   this.files = doneList;
    // }
    this.files = this.files.filter(x => x.fileId !== fileId);
    
    console.log('[DELETE] success', json);
    const deletedKey = json?.deletedKey || key;

    this.dispatchEvent(
      new CustomEvent('filedeleted', {
        detail: {
          key: deletedKey,
          fileId: fileId, // Optional, if you want to pass more info,
          files: this.files
        },
        bubbles: true,
        composed: true
      })
    );
  } catch (e) {
    clearInterval(ticker);
    // rollback deleting state
    const errList = [...this.files];
    const j = errList.findIndex(x => x.fileId === fileId);
    if (j !== -1) {
      const back = { ...errList[j] };
      back.deleting = false;
      back.deleteProgress = 0;
      errList[j] = back;
      this.files = errList;
    }
    console.error('[DELETE] error', e);
  }
  
}

normalizeRow(row) {
  // deletable if we have either key or url, and we're not currently deleting
  const hasLocator = !!(row && (row.key || row.url));
  row.deleteDisabled = !hasLocator || !!row.deleting;
  return row;
}
// Generate a compact unique id (timestamp + random hex)
makeRecordId() {
  const ts = Date.now().toString(36); // time seed
  const rnd = crypto.getRandomValues(new Uint8Array(6));
  const hex = Array.from(rnd).map(b => b.toString(16).padStart(2, '0')).join('');
  return `rec_${ts}_${hex}`; // e.g., rec_mb3l6q2g_7fa9c3d1b2e4
}

// Ensure we have a recordId; generate once per session if missing
ensureRecordId() {
  if (!this.recordId || !String(this.recordId).trim()) {
    this.recordId = this.makeRecordId();
    console.log('[AUTO] recordId generated:', this.recordId);
  }
}




ingestFilesFromParent(picked) {
  // normalize
  const incoming = picked instanceof FileList
    ? Array.from(picked)
    : Array.isArray(picked) ? picked : [];

  // no files → clear UI + queue
  if (!incoming.length) {
    console.log('[INGEST] no files provided by parent');
    this.files = [];
    this.showConfirm = false;
    this.isUploading = false;
    this.overallProgress = 0;
    return;
  }

  this.ensureRecordId();

  // Enforce 10MB cap per *selection action* (not counting existing queue)
  const accepted = [];
  const tooBig = [];
  const skippedForTotal = [];
  let total = 0;

  for (const f of incoming) {
    if (f.size > MAX_SELECTION_BYTES) {
      tooBig.push(f);
      continue;
    }
    if (total + f.size > MAX_SELECTION_BYTES) {
      skippedForTotal.push(f);
      continue;
    }
    accepted.push(f);
    total += f.size;
  }

  if (tooBig.length) {
    const names = tooBig.map(f => `${f.name} (${this.humanFileSize(f.size)})`).join(', ');
    this.toast('File too large', `Skipped: ${names}. Limit is 10 MB per file.`, 'error');
    this.dispatchEvent(
      new CustomEvent('cancel', {
        detail: {
          message: 'hello'
         
        },
        bubbles: true,
        composed: true
      })
    );
    return
  }
  if (skippedForTotal.length) {
    const names = skippedForTotal.map(f => `${f.name} (${this.humanFileSize(f.size)})`).join(', ');
    this.toast('Selection limit', `Added ${accepted.length} file(s) up to 10 MB. Skipped: ${names}`, 'warning');
  }

  // Map accepted to queue items and APPEND to existing queue
  const addQueue = accepted.map(file => ({
    file,
    fileId: this.uuid(),
    totalBytes: file.size,
    uploadedBytes: 0,
    totalParts: Math.ceil(file.size / CHUNK_BYTES),
    progress: 0,
    status: 'pending',
    url: null
  }));

  this.files = [...this.files, ...addQueue].map(f => ({
    ...f,
    humanSize: this.humanFileSize(f.totalBytes)
  }));

  console.log('[INGEST] queued from parent:', this.files.map(x => ({
    name: x.file?.name, size: x.totalBytes, id: x.fileId
  })));


  // console.log('[INFO] Human-readable file sizes:');
  // this.files.forEach(f => {
  //   console.log(`- ${f.file?.name || 'Unknown'}: ${f.humanSize}`);
  // });

  // Child-owned UI state
  this.showConfirm = this.files.length > 0; // show confirm/removal UI
  this.isUploading = false;                 // unlocked until Confirm
  this.overallProgress = 0;                 // reset progress bar
  this.uploadComplete = false;
  this.uploadedFiles = [];
}


  // ====== New: only start when we have files + modulePath + confirmUpload ======
  _checkAndStart() {
    const hasFiles = Array.isArray(this.files) && this.files.length > 0;
    const hasModule = !!this.getModulePathKey();
    const confirmed = this._confirmUpload === true;

    if (!this._uploading && hasFiles && hasModule && confirmed) {
      // reset the flag to avoid accidental double starts if parent re-renders
      this._confirmUpload = false;
      // kick off asynchronously to let parent’s setter finish
      Promise.resolve().then(() => this.safeStartUpload());
    }
  }

  async safeStartUpload() {
    try {
      await this.ensureLibs();
    } catch { /* ignored, we fallback */ }
    await this.startUpload(); // will dispatch uploadcomplete when done
  }

@api contextCellId;                  // parent passes the cell id (ctx)
@track showConfirm = false;          // show/hide confirm UI (child-owned)
@track isUploading = false;          // lock UI while uploading
@track overallProgress = 0;          // 0..100 shown in child progress bar
@track uploadComplete = false;

get disableConfirm() { return !this.files?.length; }
get pendingMode() { return this.showConfirm && !this.uploadComplete; }
get doneMode()    { return this.showConfirm &&  this.uploadComplete; }
get pendingFilesUi() {
  return (this.files || []).map((f, i) => ({
    key: f.fileId,
    name: f.file?.name,
    sizeText: this.humanFileSize(f.totalBytes ?? f.file?.size ?? 0),
    index: i
  }));
}
get confirmDisabled() {
  return this.isUploading || this.disableConfirm;
}
removePendingFile = (event) => {
  const idx = Number(event.currentTarget.dataset.index);
  if (Number.isNaN(idx)) return;
  const next = [...this.files];
  next.splice(idx, 1);
  this.files = next;
  if (!next.length) {
    this.showConfirm = false;
    this.overallProgress = 0;
  }
};
get uploadedFilesUi() {
  return (this.uploadedFiles || []).map((f, i) => ({
    key: f.fileId || String(i),
    name: f.originalName || this.nameFromUrl(f.url) || 'File'
  }));
}
nameFromUrl(url) {
  try { return decodeURIComponent(new URL(url).pathname.split('/').pop()); }
  catch { return null; }
}

confirmClick = async () => {
  if (!this.files?.length || this.isUploading) return;
  this.isUploading = true;
  this.uploadComplete = true;  
  this.overallProgress = 0;
  try {
    await this.ensureLibs();
    await this.startUpload();   // will fire uploadcomplete
  } catch (e) {
    this.dispatchEvent(new ShowToastEvent({
      title: 'Upload failed', message: e?.message || 'Unknown error', variant: 'error'
    }));
  } finally {
    this.isUploading = false;
    this.showConfirm = true;   // hide UI after run
    this.overallProgress = 100;
    // this.files = [];
    setTimeout(() => { this.overallProgress = 0; }, 600);
  }
};

cancelClick = () => {
  console.log('cancelClick called');
  this.files = [];
  this.showConfirm = false;
  this.isUploading = false;
  this.overallProgress = 0;
   this.dispatchEvent(
      new CustomEvent('cancel', {
        detail: {
          message: 'hello'
         
        },
        bubbles: true,
        composed: true
      })
    );
};
doneClick = () => {
  this.showConfirm = true;
  this.uploadComplete = false;
  this.uploadedFiles = [];
  this.overallProgress = 0;
  this.files = [];
};


dispatchOverallProgress() {
  try {
    const totals = this.files.reduce((acc, f) => {
      acc.total += f.totalBytes || 0;
      const sent = (f.status === 'uploaded' || f.status === 'completed')
        ? (f.totalBytes || 0)
        : Math.min(f.uploadedBytes || 0, f.totalBytes || 0);
      acc.sent += sent;
      return acc;
    }, { total: 0, sent: 0 });

    const pct = totals.total ? Math.round((totals.sent / totals.total) * 100) : 0;
    this.overallProgress = Math.max(0, Math.min(100, pct)); // 👈 update child UI
    this.dispatchEvent(new CustomEvent('uploadprogress', {
      detail: { overallPercent: this.overallProgress, ctx: this.contextCellId }
    }));
  } catch {}
}

}