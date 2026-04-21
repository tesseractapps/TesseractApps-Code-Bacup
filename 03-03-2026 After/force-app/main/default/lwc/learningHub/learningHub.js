import { LightningElement, track,wire,api } from 'lwc';
import getUserModules from '@salesforce/apex/UserAccessController.getUserModules';
import CURRENT_USER_ID from '@salesforce/user/Id';
import videoDataUrl from '@salesforce/resourceUrl/TLearnerData';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';

import getPresignedUrl from '@salesforce/apex/WordEditorController.getPresignedUrl';
import createTLearner from '@salesforce/apex/TLearnerController.createTLearner';
import fetchTLearners from '@salesforce/apex/TLearnerController.fetchTLearners';
import getOrganisations from '@salesforce/apex/TLearnerController.getOrganisations';


const USER_FIELDS = ['User.User_Role__c', 'User.User_Type__c', 'User.Can_Upload_Tutorials__c'];

export default class LearningHub extends LightningElement {
    @track searchTerm = '';
    @track selectedPlatform = 'all';
    @track selectedVideo = null;
    @track isVideoModalOpen = false;
    @track currentTime = 0;
    @track duration = 0;
    @track isPlaying = false;
    @track volume = 1;
    @track isMuted = false;
    @track showControls = true;
    @track videoData = [];
    userId = CURRENT_USER_ID;
    userModuleIds = [];
    @track categoryPlatformMap = {};
     
    @track currentUserRole;
    @track currentUserType;

    @track platformValue = '';
@track roleValue = '';
@track canUploadTutorials = false;

@wire(getRecord, { recordId: USER_ID, fields: USER_FIELDS })
wiredUser({ error, data }) {
  if (data) {
    // Safe reads (avoid "cannot read value of undefined")
    this.currentUserRole = data.fields?.User_Role__c?.value || null;
    this.currentUserType = data.fields?.User_Type__c?.value || null;

    this.canUploadTutorials = data.fields?.Can_Upload_Tutorials__c?.value === true;

    console.log('👤 User Role:', this.currentUserRole);
    console.log('👤 User Type:', this.currentUserType);
    console.log('🔐 Can Upload Tutorials:', this.canUploadTutorials);

    this.filterIfReady(); // keep your existing flow
  } else if (error) {
    console.error('❌ Error loading user fields:', error);

    // Safe defaults
    this.currentUserRole = null;
    this.currentUserType = null;
    this.canUploadTutorials = false;
  }
}



    // Get user modules
    @wire(getUserModules, { userIds: '$userId' })
    wiredUserModules({ error, data }) {
        if (data && Array.isArray(data)) {
            const modules = data[0]?.Modules || [];
            this.userModuleIds = modules.map(m => m.toLowerCase().replace(/\s+/g, '-'));
            console.log('📦 Modules:', this.userModuleIds);
            this.filterIfReady();
        } else if (error) {
            console.error('❌ Error fetching user modules:', error);
        }
    }

    _rawVideoData = [];

    // 2. Load videoData from static resource
    connectedCallback() {
        fetch(videoDataUrl)
            .then(res => res.json())
            .then(data => {
                this._rawVideoData = data;
                this.filterIfReady();
            })
            .catch(err => console.error('❌ Error loading videoData:', err));

            this.expireDate = this.addDaysToToday(120);
    }

    // Wait until all 3 inputs are ready
    filterIfReady() {
    if (!this._rawVideoData.length || !this.userModuleIds.length || !this.currentUserRole) {
        console.log('⏳ Waiting for all data...');
        return;
    }

    // const unrestrictedAccess = ['Portal Account Partner Executive', 'CEO','Admin'].includes(this.currentUserRole);
    const unrestrictedAccess = ['CEO'].includes(this.currentUserRole);
    console.log('👤 currentUserRole:', this.currentUserRole);
    console.log('👤 currentUserType:', this.currentUserType);
    console.log('🔓 Unrestricted Access?', unrestrictedAccess);

    this.videoData = this._rawVideoData
        .filter(cat => this.userModuleIds.includes(cat.id))
        .map(cat => {
            let filteredVideos = cat.videos;

            if (!unrestrictedAccess) {
                // Admin category filtering
                if (cat.id === 'admin') {
                    if (this.currentUserType === 'NDIS Org Admin') {
                        // allow all
                    } else {
                        filteredVideos = [];
                    }
                }


                // Roster Manager category filtering
                if (cat.id === 'roster-manager') {
                    if (this.currentUserType === 'NDIS Org Admin') {
                        // allow all
                    } else if (this.currentUserType === 'NDIS Staff') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'roster-manager-staff');
                    } else {
                        filteredVideos = [];
                    }
                }



                if (cat.id === 'access-manager') {
                    if (this.currentUserType === 'NDIS Org Admin') {
                        // show all
                    } else {
                        filteredVideos = [];
                    }
                }

                if (cat.id === 'repository' || cat.id === 't-sign') {
                    const allowedTypes = ['NDIS Org Admin', 'HR Admin', 'Facility Admin', 'Roster Manager'];
                    if (!allowedTypes.includes(this.currentUserType)) {
                        filteredVideos = [];
                    }
                }
                if (cat.id === 'incident-register') {
                    if (this.currentUserType === 'NDIS Org Admin') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'incident-register-admin');
                    } else if (this.currentUserType === 'NDIS Staff') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'incident-register-staff');
                    } else if (this.currentUserType === 'Roster Manager') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'incident-register-rm');
                    } else {
                        filteredVideos = [];
                    }
                }
                if (cat.id === 'participants') {
                    if (this.currentUserType === 'NDIS Org Admin') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'participants-admin');
                    } else if (this.currentUserType === 'NDIS Staff') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'participants-staff');
                    } else if (this.currentUserType === 'Roster Manager') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'participants-rm');
                    } else {
                        filteredVideos = [];
                    }
                }

                if (cat.id === 'sign-in') {
                    if (this.currentUserType === 'NDIS Org Admin') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'sign-in-admin');
                    } else if (this.currentUserType === 'NDIS Staff') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'sign-in-staff');
                    } else if (this.currentUserType === 'Roster Manager') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'sign-in-rm');
                    } else {
                        filteredVideos = [];
                    }
                }

                if (cat.id === 'human-resources') {
                    if (this.currentUserType === 'NDIS Org Admin') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'leave-management-admin');
                    } else if (this.currentUserType === 'Roster Manager') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'leave-management-rm');
                    } else {
                        filteredVideos = [];
                    }
                }
                if (cat.id === 'my-profile') {
                    if (this.currentUserType === 'NDIS Staff') {
                        filteredVideos = filteredVideos.filter(v => v.id === 'leave-management-staff');
                    } else {
                        filteredVideos = [];
                    }
                }






            }

            return {
                ...cat,
                videos: filteredVideos,
                count: filteredVideos.length,
                title: `${cat.title.split('(')[0].trim()} (${filteredVideos.length})`
            };
        })
        .filter(cat => cat.videos.length > 0);
        this.setDefaultPlatformMap(this.videoData);
        this.videoData = this.videoData.map(cat => ({
    ...cat,
    tabClasses: {
    web:
        this.selectedPlatform === 'all'
            ? 'tab-button disabled'
            : this.categoryPlatformMap[cat.id] === 'web'
                ? 'tab-button active'
                : 'tab-button',
    mobile:
        this.selectedPlatform === 'all'
            ? 'tab-button disabled'
            : this.categoryPlatformMap[cat.id] === 'mobile'
                ? 'tab-button active'
                : 'tab-button'
}

}));

    console.log('🎯 Final Filtered Categories:', this.videoData.map(c => `${c.id} (${c.count})`));
    
}


// get filteredVideoData() {
//     const search = this.searchTerm?.toLowerCase() || '';
//     const showAllPlatforms = this.selectedPlatform === 'all';

//     return this.videoData.map(category => {
//         const selected = this.categoryPlatformMap[category.id];
//         return {
//             ...category,
//             videos: category.videos.filter(video => {
//                 const matchesSearch = !search || video.title.toLowerCase().includes(search);
//                 const videoPlatform = video.platform?.toLowerCase() || '';
//                 const matchesPlatform =
//                     showAllPlatforms || (selected && videoPlatform.includes(selected + ' application'));
//                 return matchesSearch && matchesPlatform;
//             })
//         };
//     }).filter(category => category.videos.length > 0);
// }

get filteredVideoData() {
    const search = this.searchTerm?.toLowerCase() || '';
    const showAllGlobally = this.selectedPlatform === 'all';

    return this.videoData
        .map(category => {
            const categorySelectedPlatform = this.categoryPlatformMap[category.id];
            const allVideos = category.videos || [];

            const filteredVideos = allVideos.filter(video => {
                const matchesSearch = !search || video.title.toLowerCase().includes(search);
                const videoPlatform = video.platform?.toLowerCase() || '';

                const matchesPlatform =
                    showAllGlobally || videoPlatform.includes(categorySelectedPlatform + ' application');

                return matchesSearch && matchesPlatform;
            });

            return {
                ...category,
                filteredVideos, // ✅ use this in template
                dynamicTitle: `${category.displaytitle.split('(')[0].trim()} (${filteredVideos.length})`,
                hasOriginalVideos: allVideos.length > 0
            };
        })
        .filter(category => category.hasOriginalVideos); // ✅ preserve category if it had original videos
}





  


    // 3. Filter based on user module access
    filterVideoDataByModules() {
        this.videoData = this._rawVideoData.filter(category =>
            this.userModuleIds.includes(category.id.toLowerCase())
        );
        console.log('✅ Filtered videoData:', this.videoData);
    }

    // 4. Search logic (title only)
    // get filteredVideoData() {
    //     const search = this.searchTerm?.toLowerCase() || '';
    //     return this.videoData.map(category => ({
    //         ...category,
    //         videos: category.videos.filter(video => {
    //             const matchesSearch = !search || video.title.toLowerCase().includes(search);
    //             const matchesPlatform =
    //                 this.selectedPlatform === 'all' ||
    //                 video.platform.toLowerCase().includes(this.selectedPlatform.toLowerCase());
    //             return matchesSearch && matchesPlatform;
    //         })
    //     })).filter(category => category.videos.length > 0);
    // }

 

setDefaultPlatformMap(videoDataArray) {
    videoDataArray.forEach(cat => {
        const hasWeb = cat.videos.some(v => v.platform === 'Web Application');
        this.categoryPlatformMap[cat.id] = hasWeb ? 'web' : 'mobile';
    });
}

handlePlatformTabClick(event) {
    const platform = event.currentTarget.dataset.platform;
    const categoryId = event.currentTarget.dataset.categoryId;

    console.log(`📌 Tab clicked: Category = ${categoryId}, Platform = ${platform}`);

    // Update only the clicked category's platform in the map
    this.categoryPlatformMap = {
        ...this.categoryPlatformMap,
        [categoryId]: platform
    };

    console.log('🧭 Updated categoryPlatformMap:', this.categoryPlatformMap);

    // Update tabClasses for the clicked category
    this.videoData = this.videoData.map(cat => {
        if (cat.id === categoryId) {
            return {
                ...cat,
                tabClasses: {
                    web: platform === 'web' ? 'tab-button active' : 'tab-button',
                    mobile: platform === 'mobile' ? 'tab-button active' : 'tab-button'
                }
            };
        }
        return cat;
    });

    // ✅ Force reevaluation of filteredVideoData (reactive getter reads from videoData and categoryPlatformMap)
    this.videoData = [...this.videoData];
}



shouldShowVideo(video, categoryId) {
    const selected = this.categoryPlatformMap[categoryId];
    if (!selected) return true;

    const videoPlatform = video.platform?.toLowerCase() || '';
    return selected === 'web'
        ? videoPlatform === 'web application'
        : videoPlatform === 'mobile application';
}
get webTabClassMap() {
    const map = {};
    if (!this.videoData?.length) return map;

    this.videoData.forEach(cat => {
        const id = cat.id;
        map[id] = {
            web: this.categoryPlatformMap[id] === 'web' ? 'tab-button active' : 'tab-button',
            mobile: this.categoryPlatformMap[id] === 'mobile' ? 'tab-button active' : 'tab-button'
        };
    });

    return map;
}



    get platformOptions() {
        return [
            { label: 'All Platforms', value: 'all' },
            { label: 'Web', value: 'web' },
            { label: 'Mobile', value: 'mobile' }
        ];
    }

    get platformOptionsUpload() {
  return [
    { label: 'Web Application', value: 'Web Application' },
    { label: 'Mobile Application', value: 'Mobile Application' }
  ];
}

//     handleSearch(event) {
//     this.searchTerm = event.target.value.trim();
// }

handleSearch(event) {
    this.searchTerm = event.target.value.trim();

    if (this.selectedPlatform !== 'all') {
        this.tryUpdateTabsOnSearch(this.searchTerm);
    }
}
tryUpdateTabsOnSearch(term) {
    const lowerTerm = term.toLowerCase();

    this.videoData.forEach(cat => {
        const currentPlatform = this.categoryPlatformMap[cat.id];
        const altPlatform = currentPlatform === 'web' ? 'mobile' : 'web';

        const hasMatchInCurrent = cat.videos.some(
            v =>
                v.platform.toLowerCase().includes(currentPlatform + ' application') &&
                v.title.toLowerCase().includes(lowerTerm)
        );

        const hasMatchInAlt = cat.videos.some(
            v =>
                v.platform.toLowerCase().includes(altPlatform + ' application') &&
                v.title.toLowerCase().includes(lowerTerm)
        );

        if (!hasMatchInCurrent && hasMatchInAlt) {
            // Auto-switch tab
            this.categoryPlatformMap = {
                ...this.categoryPlatformMap,
                [cat.id]: altPlatform
            };

            // Update tab button classes
            this.videoData = this.videoData.map(c =>
                c.id === cat.id
                    ? {
                          ...c,
                          tabClasses: {
                              web: altPlatform === 'web' ? 'tab-button active' : 'tab-button',
                              mobile: altPlatform === 'mobile' ? 'tab-button active' : 'tab-button'
                          }
                      }
                    : c
            );
        }
    });
}


    handlePlatformChange(event) {
    this.selectedPlatform = event.target.value;

    // Update category platform map only if Web or Mobile is selected
    if (this.selectedPlatform === 'web' || this.selectedPlatform === 'mobile') {
        const updatedMap = {};
        this.videoData.forEach(cat => {
            updatedMap[cat.id] = this.selectedPlatform;
        });
        this.categoryPlatformMap = updatedMap;
    }

    // Update tabClasses accordingly
    this.videoData = this.videoData.map(cat => {
        const platform = this.categoryPlatformMap[cat.id];
        return {
            ...cat,
            tabClasses: {
    web:
        this.selectedPlatform === 'all'
            ? 'tab-button disabled'
            : this.categoryPlatformMap[cat.id] === 'web'
                ? 'tab-button active'
                : 'tab-button',
    mobile:
        this.selectedPlatform === 'all'
            ? 'tab-button disabled'
            : this.categoryPlatformMap[cat.id] === 'mobile'
                ? 'tab-button active'
                : 'tab-button'
}

        };
    });

    console.log('🌐 Global Platform Changed To:', this.selectedPlatform);
    console.log('🔄 Updated categoryPlatformMap:', this.categoryPlatformMap);
}


    handleVideoClick(event) {
        const videoId = event.currentTarget.dataset.videoId;
        const categoryId = event.currentTarget.dataset.categoryId;
        
        const category = this.videoData.find(cat => cat.id === categoryId);
        const video = category.videos.find(vid => vid.id === videoId);
        
        this.selectedVideo = video;
        this.isVideoModalOpen = true;
    }

closeVideoModal() {
    const modal = this.template.querySelector('.video-modal');
    const backdrop = this.template.querySelector('.modal-backdrop');

    if (modal) {
        modal.classList.remove('opened');
        modal.classList.add('closing');
    }

    if (backdrop) {
        backdrop.classList.add('closing');
    }

    // Delay removal until after animation
    setTimeout(() => {
        this.isVideoModalOpen = false;
        this.selectedVideo = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.youTubePlayerInitialized = false;
        this.player = null;
    }, 400); // Match CSS transition duration
}



    handleVideoTimeUpdate(event) {
        this.currentTime = event.target.currentTime;
        this.duration = event.target.duration;
    }

    handleSeek(event) {
        const video = this.template.querySelector('.video-player');
        const rect = event.currentTarget.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const newTime = percent * this.duration;
        
        if (video) {
            video.currentTime = newTime;
            this.currentTime = newTime;
        }
    }

    handleVolumeChange(event) {
        const video = this.template.querySelector('.video-player');
        this.volume = event.target.value;
        if (video) {
            video.volume = this.volume;
        }
    }

    toggleMute() {
        const video = this.template.querySelector('.video-player');
        if (video) {
            video.muted = !video.muted;
            this.isMuted = video.muted;
        }
    }

    toggleFullscreen() {
        const modal = this.template.querySelector('.video-modal');
        if (modal.requestFullscreen) {
            modal.requestFullscreen();
        }
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    get progressPercentage() {
        if (!this.duration) return 0;
        return (this.currentTime / this.duration) * 100;
    }

    get isYouTubeVideo() {
    return this.selectedVideo && this.selectedVideo.videoUrl.includes('youtube.com');
}

get isYouTubeVideo() {
    return this.selectedVideo && this.selectedVideo.videoUrl.includes('youtube.com');
}






handleContextMenu(event) {
    event.preventDefault();
}



renderedCallback() {
    if (this.isVideoModalOpen && !this.isYouTubeVideo) {
        const video = this.template.querySelector('video.video-player');
        if (video) {
            video.setAttribute('controlsList', 'nodownload noremoteplayback');
        }
    }

    if (this.isVideoModalOpen) {
        const modal = this.template.querySelector('.video-modal');
        if (modal && !modal.classList.contains('opened')) {
            modal.classList.add('opening');
            requestAnimationFrame(() => {
                // Trigger reflow so the transition plays
                void modal.offsetWidth;
                modal.classList.remove('opening');
                modal.classList.add('opened');
            });
        }
    }

    // Existing YouTube logic
    if (this.isVideoModalOpen && this.isYouTubeVideo && !this.youTubePlayerInitialized) {
        const iframe = this.template.querySelector('iframe.video-player');
        if (iframe && window.YT && window.YT.Player) {
            this.player = new YT.Player(iframe, {
                events: {
                    'onReady': () => {
                        this.youTubePlayerInitialized = true;
                    }
                }
            });
        }
    }
}

@track tvideosflag = true;
@track onboardflag = false;

@track showOnboardCreate = false;

get tvideosClass(){
        return this.tvideosflag  ? 'menu-item1' : 'menu-item'; 
    
    }

get onboardClass() {
  return this.onboardflag ? 'menu-item1' : 'menu-item';
}

       handleTvideos(event){
        this.tvideosflag=true;
        this.onboardflag=false;
          this.showOnboardCreate = false;
        }

       handleOnboard(event) {
  this.tvideosflag = false;
  this.onboardflag = true;
  this.showOnboardCreate = false;

  this.fetchOnboardRecords(); // 🔥 THIS WAS MISSING
}


        handleNewOnboard() {
  this.showOnboardCreate = true;
}

handleBackToList() {
  this.showOnboardCreate = false;
  this.fetchOnboardRecords(); // refresh
  this.resetForm();
}

resetForm() {
  // ✅ Reset the EXACT variables used in your template
  this.title = '';
  this.description = '';

  this.organizationId = null;   // ✅ clears org combobox
  this.platformValue = null;    // ✅ clears platform combobox
  this.roleValue = null;        // ✅ clears role combobox

  this.expireDate = null;       // ✅ template uses expireDate

  // ✅ Files + file names shown in UI
  this.thumbnailFile = null;
  this.videoFile = null;
  this.thumbnailFileName = null;
  this.videoFileName = null;

  // Optional: if you show preview anywhere
  this.thumbnailPreview = null;

  // Status text
  this.status = '';

  // UI flags (don’t force-close modal unless you want to)
  this.isSaving = false;
  this.isLoadingCircle = false;

  // ✅ Reset lightning inputs (optional but fine)
  const lwcInputs = this.template.querySelectorAll(
    'lightning-input, lightning-textarea, lightning-combobox'
  );
  lwcInputs.forEach(el => {
    // lightning-input supports .value, combobox supports .value
    el.value = null;
  });

  // ✅ Reset hidden native file inputs
  const fileInputs = this.template.querySelectorAll('input[type="file"]');
  fileInputs.forEach(i => (i.value = ''));
}




        //  bucketName = 'datainfo';
        bucketName = 'docimgupld';

  @track title = '';
  @track description = '';
  @track organizationId; // from lightning-input-field or lookup component

  thumbnailFile;
  videoFile;

  @track thumbnailFileName = '';
@track videoFileName = '';
@track uploadedThumbKey = '';
@track uploadedVideoKey = '';
@track expireDate;

  @track isSaving = false;
  @track status = '';

handleTitleChange(e){
  this.title = e.target.value;
  console.log('[TLearner] Title changed:', this.title);
}

handleDescChange(e){
  this.description = e.target.value;
  console.log('[TLearner] Description changed:', this.description?.length);
}

handleThumbnailChange(e){
  const f = e.target.files?.[0];
  console.log('[TLearner] Thumbnail selected:', f);

  if (!f) return;

  if (!f.type?.startsWith('image/')) {
    this.status = 'Thumbnail must be an image.';
    this.thumbnailFile = null;
    this.thumbnailFileName = '';
    console.warn('[TLearner] Invalid thumbnail type:', f.type);
    return;
  }

  this.thumbnailFile = f;
  this.thumbnailFileName = f.name;
  this.status = `Thumbnail selected: ${f.name}`;
}

handleVideoChange(e){
  const f = e.target.files?.[0];
  console.log('[TLearner] Video selected:', f);

  if (!f) return;

  if (!f.type?.startsWith('video/')) {
    this.status = 'Video must be a video file.';
    this.videoFile = null;
    this.videoFileName = '';
    console.warn('[TLearner] Invalid video type:', f.type);
    return;
  }

  this.videoFile = f;
  this.videoFileName = f.name;
  this.status = `Video selected: ${f.name}`;
}


  sanitizeName(name){
    return (name || 'file').replace(/\s+/g,'_').replace(/[^a-zA-Z0-9._-]/g,'');
  }

async uploadToS3({ file, folder }) {
  const ts = Date.now();
  const safe = this.sanitizeName(file.name);
  const key = `tlearner/${folder}/${ts}-${safe}`;

  console.log('[TLearner] Presign request:', {
    bucketName: this.bucketName,
    key,
    contentType: file.type,
    fileName: file.name,
    size: file.size
  });

  const presign = await getPresignedUrl({
    bucketName: this.bucketName,
    key,
    contentType: file.type
  });

  console.log('[TLearner] Presign response:', presign);

  if (!presign?.uploadUrl || !presign?.key) {
    throw new Error('Presign response missing uploadUrl/key');
  }

  console.log('[TLearner] Uploading to S3 PUT:', presign.key);

  const putResp = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });

  console.log('[TLearner] S3 PUT response:', putResp.status, putResp.statusText);

  if (!putResp.ok) {
    throw new Error(`S3 PUT failed: ${putResp.status} ${putResp.statusText}`);
  }

  const url = `https://${this.bucketName}.s3.amazonaws.com/${presign.key}`;
  console.log('[TLearner] Uploaded OK:', { key: presign.key, url });

  return { key: presign.key, url, contentType: file.type, fileName: file.name };
}

@track isLoadingCircle = false;


async handleSubmit() {
  // ✅ Turn ON loader immediately on submit click
  this.isLoadingCircle = true;

  // Use ONLY passed org id if available, else fallback to combobox org id
  const orgIdToUse = this.organizationId;

  const expireDateToUse =
    this.expireDate || this.addDaysToToday(120); // fallback safety

  console.log('[TLearner] Submit clicked', {
    title: this.title,
    descriptionLen: this.description?.length,
    orgIdToUse,
    platformValue: this.platformValue,
    roleValue: this.roleValue,
    expireDate: expireDateToUse,
    thumbnailSelected: !!this.thumbnailFile,
    videoSelected: !!this.videoFile,
    thumbnailFileName: this.thumbnailFileName,
    videoFileName: this.videoFileName
  });

  // ---- validations (DO NOT REMOVE existing ones) ----
  const t = (this.title || '').trim();
  if (!t) {
    this.status = 'Title is required.';
    console.warn('[TLearner] Validation failed: title empty');
    this.isLoadingCircle = false; // ✅ stop loader on validation exit
    return;
  }

  if (!orgIdToUse) {
    this.status = 'Organization is required.';
    console.warn('[TLearner] Validation failed: org missing');
    this.isLoadingCircle = false;
    return;
  }

  if (!this.platformValue) {
    this.status = 'Platform is required.';
    console.warn('[TLearner] Validation failed: platform missing');
    this.isLoadingCircle = false;
    return;
  }

  if (!this.roleValue) {
    this.status = 'Role is required.';
    console.warn('[TLearner] Validation failed: role missing');
    this.isLoadingCircle = false;
    return;
  }

  if (!this.thumbnailFile) {
    this.status = 'Thumbnail is required.';
    console.warn('[TLearner] Validation failed: thumbnail missing');
    this.isLoadingCircle = false;
    return;
  }

  if (!this.videoFile) {
    this.status = 'Video is required.';
    console.warn('[TLearner] Validation failed: video missing');
    this.isLoadingCircle = false;
    return;
  }

  // ---- upload + create ----
  this.isSaving = true;
  this.status = `Uploading: ${this.thumbnailFileName} + ${this.videoFileName}`;

  try {
    // Upload thumbnail
    console.log('[TLearner] Uploading thumbnail...');
    const thumb = await this.uploadToS3({
      file: this.thumbnailFile,
      folder: 'thumbnails'
    });
    this.uploadedThumbKey = thumb.key;
    console.log('[TLearner] Thumbnail uploaded:', thumb);

    // Upload video
    console.log('[TLearner] Uploading video...');
    const vid = await this.uploadToS3({
      file: this.videoFile,
      folder: 'videos'
    });
    this.uploadedVideoKey = vid.key;
    console.log('[TLearner] Video uploaded:', vid);

    // Build AWS JSON (unchanged behavior)
    const awsJsonObj = {
      platform: this.platformValue, // "Web Application" / "Mobile Application"
      role: this.roleValue,         // "Admin" / "Staff"
      thumbnail: { bucket: this.bucketName, ...thumb },
      video: { bucket: this.bucketName, ...vid }
    };

    console.log('[TLearner] awsJsonObj:', awsJsonObj);

    this.status = 'Creating record...';

    console.log('[TLearner] createTLearner payload =>', JSON.stringify({
      title: t,
      description: this.description,
      organizationId: orgIdToUse,
      platformValue: this.platformValue,
      roleValue: this.roleValue,
      expireDate: expireDateToUse,
      awsJsonLen: JSON.stringify(awsJsonObj)?.length
    }));

    const recId = await createTLearner({
      title: t,
      description: this.description,
      organizationId: orgIdToUse,
      awsJson: JSON.stringify(awsJsonObj),
      platformValue: this.platformValue,
      roleValue: this.roleValue,
      expireDate: expireDateToUse
    });

    console.log('[TLearner] Record created:', recId);

    this.status = `✅ Created | Expires on ${expireDateToUse}`;

    this.resetForm();

    // Reset expire date back to default (today + 120)
    this.expireDate = this.addDaysToToday(120);

    // Return to list and refresh
    this.showOnboardCreate = false;
    await this.fetchOnboardRecords();

  } catch (e) {
    console.error('[TLearner] Submit failed:', e);
    const msg = e?.body?.message || e?.message || 'Unknown error';
    this.status = `❌ Failed: ${msg}`;
  } finally {
    this.isSaving = false;
    this.isLoadingCircle = false; // ✅ ALWAYS stop loader (success/error)
  }
}






_orgid;

 @api
  get orgid() {
    return this._orgid;
  }
  set orgid(value) {
    this._orgid = value;
    console.log('[LearningHub] orgid received from parent:', value);
  }

@track onboardRecords = [];
@track isLoadingOnboard = false;

get isPrivilegedRole() {
  return (
    this.currentUserRole === 'Portal Account Partner Executive' ||
    this.currentUserRole === 'Portal Account Partner Manager' ||
    this.currentUserRole === 'CEO'
  );
}

get isPortalPartnerUser() {
  return this.currentUserRole === 'Portal Account Partner User';
}

async fetchOnboardRecords() {
  console.log('[LearningHub] fetchOnboardRecords using passed orgid ONLY:', this._orgid);

  if (!this._orgid) {
    this.onboardRecords = [];
    return;
  }

  // Role filter rule:
  // - Portal Account Partner User => only Staff
  // - Privileged roles => all
  // - Others => all (default)
  let roleFilter = null;
  if (this.isPortalPartnerUser) {
    roleFilter = 'Staff';
  } else if (this.isPrivilegedRole) {
    roleFilter = null;
  } else {
    roleFilter = null;
  }

  const platformFilter = this.selectedPlatformFilter || null;

  console.log('[LearningHub] filters:', {
    platform: platformFilter,
    roleFilter,
    currentUserRole: this.currentUserRole
  });

  this.isLoadingOnboard = true;

  try {
    const data = await fetchTLearners({
      organizationId: this._orgid,
      platformValue: platformFilter,
      roleValue: roleFilter
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const normalized = (data || []).map(r => {
      let aws = {};
      try {
        aws = r.AWS_Json__c ? JSON.parse(r.AWS_Json__c) : {};
      } catch (e) {
        console.warn('[LearningHub] AWS_Json__c parse failed for record:', r?.Id, e);
      }

      const expireStr = r.Expire_Date__c; // Date field from Apex (YYYY-MM-DD)
      const expireDate = expireStr ? new Date(expireStr + 'T00:00:00') : null;

      return {
        ...r,
        thumbnailUrl: aws?.thumbnail?.url,
        videoUrl: aws?.video?.url,
        platform: r.Platform__c || aws?.platform || '',
        role: r.Role__c || aws?.role || '',
        expireDateStr: expireStr || null,
        isExpired: expireDate ? expireDate < today : false // if null => treat as not expired
      };
    });

    // Extra safety filter (even if Apex already filters)
    this.onboardRecords = normalized.filter(r => !r.isExpired);

    console.log('[LearningHub] onboardRecords loaded:', {
      totalFromServer: (data || []).length,
      afterExpiryFilter: this.onboardRecords.length
    });

  } catch (e) {
    console.error('[LearningHub] fetchOnboardRecords failed:', e);
    this.onboardRecords = [];
  } finally {
    this.isLoadingOnboard = false;
  }
}



get hasOnboardRecords() {
  return (this.filteredOnboardRecords || []).length > 0;
}

get onboardGroupedByRole() {
  const map = new Map();

  // IMPORTANT CHANGE:
  // Use filteredOnboardRecords instead of onboardRecords
  (this.filteredOnboardRecords || []).forEach(r => {
    const role = r.role || 'Other';
    if (!map.has(role)) map.set(role, []);
    map.get(role).push(r);
  });

  // Preserve your ordering logic
  const order = {
    'Admin': 1,
    'Staff': 2,
    'Other': 99
  };

  return Array.from(map.entries())
    .map(([role, records]) => ({
      role,
      count: records.length,
      records
    }))
    .sort((a, b) =>
      (order[a.role] || 50) - (order[b.role] || 50)
    );
}


  @track organizationId;
  @track orgOptions = [];
  @track status = '';

   @wire(getOrganisations)
  wiredOrgs({ data, error }) {
    if (data) {
      this.orgOptions = data; // already {label, value}
    } else if (error) {
      console.error('Org load failed', error);
      this.status = 'Failed to load organizations';
      this.orgOptions = [];
    }
  }

  handleOrgChange(event) {
    this.organizationId = event.detail.value;

    // If onboarding list is currently active, refresh records for selected org
    if (this.onboardflag && !this.showOnboardCreate) {
      this.fetchOnboardRecords(); // your imperative fetch method
    }
  }

handlePlayOnboardClick(event) {
  event.stopPropagation(); // IMPORTANT
  const recId = event.currentTarget.dataset.recId;

  const rec = (this.onboardRecords || []).find(r => r.Id === recId);
  if (!rec) return;

  this.selectedVideo = {
    title: rec.Title__c,
    thumbnail: rec.thumbnailUrl,
    videoUrl: rec.videoUrl
  };

  this.isVideoModalOpen = true;
}

get roleOptions() {
  return [
    { label: 'Admin', value: 'Admin' },
    { label: 'Staff', value: 'Staff' }
  ];
}

handlePlatformPick(e) {
  this.platformValue = e.detail.value;
  console.log('[TLearner] Platform selected:', this.platformValue);
}

handleRolePick(e) {
  this.roleValue = e.detail.value;
  console.log('[TLearner] Role selected:', this.roleValue);
}

triggerFileInput(event) {
  const wrapper = event.currentTarget.closest('.floating-label');
  const input = wrapper.querySelector('input[type="file"]');
  if (input) input.click();
}
onFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const type = event.target.dataset.type;

  if (type === 'thumbnail') {
    if (!file.type.startsWith('image/')) {
      this.status = 'Thumbnail must be an image.';
      return;
    }
    this.thumbnailFile = file;
    this.thumbnailFileName = file.name;
    console.log('[TLearner] Thumbnail selected:', file.name);
  }

  if (type === 'video') {
    if (!file.type.startsWith('video/')) {
      this.status = 'Video must be a video file.';
      return;
    }
    this.videoFile = file;
    this.videoFileName = file.name;
    console.log('[TLearner] Video selected:', file.name);
  }
}

addDaysToToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  // format YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

handleExpireDateChange(e) {
  this.expireDate = e.target.value;
  console.log('[TLearner] Expire date selected:', this.expireDate);
}
get onboardPlatformValue() {
  // dropdown values likely: all / web / mobile
  if (this.selectedPlatform === 'web') return 'Web Application';
  if (this.selectedPlatform === 'mobile') return 'Mobile Application';
  return null; // all
}

get filteredOnboardRecords() {
  const search = (this.searchTerm || '').trim().toLowerCase();
  const selectedPlatform = this.selectedPlatform || 'all';

  return (this.onboardRecords || []).filter(rec => {
    // ---- search filter ----
    const title = (rec.Title__c || '').toLowerCase();
    const desc  = (rec.Description__c || '').toLowerCase();
    const matchesSearch =
      !search || title.includes(search) || desc.includes(search);

    // ---- platform filter ----
    let matchesPlatform = true;
    if (selectedPlatform !== 'all') {
      const recPlatform = (rec.platform || '').toLowerCase();
      if (selectedPlatform === 'web') {
        matchesPlatform = recPlatform.includes('web');
      } else if (selectedPlatform === 'mobile') {
        matchesPlatform = recPlatform.includes('mobile');
      }
    }

    return matchesSearch && matchesPlatform;
  });
}


get hasFilteredOnboardRecords() {
  return (this.filteredOnboardRecords || []).length > 0;
}


}