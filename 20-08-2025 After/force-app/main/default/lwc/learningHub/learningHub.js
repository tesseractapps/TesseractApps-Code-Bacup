import { LightningElement, track,wire } from 'lwc';
import getUserModules from '@salesforce/apex/UserAccessController.getUserModules';
import CURRENT_USER_ID from '@salesforce/user/Id';
import videoDataUrl from '@salesforce/resourceUrl/TLearnerData';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';

const USER_FIELDS = ['User.User_Role__c', 'User.User_Type__c'];

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

    @wire(getRecord, { recordId: USER_ID, fields: USER_FIELDS })
wiredUser({ error, data }) {
    if (data) {
        this.currentUserRole = data.fields.User_Role__c.value;
        this.currentUserType = data.fields.User_Type__c.value;
        console.log('👤 User Role:', this.currentUserRole);
        console.log('👤 User Type:', this.currentUserType);
        this.filterIfReady();
    } else if (error) {
        console.error('❌ Error loading user fields:', error);
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


}