import { LightningElement, track, wire, api } from 'lwc';
import getCometChatCredentialsForCurrentUser
  from '@salesforce/apex/CometChatService.getCometChatCredentialsForCurrentUser';
import saveCometChatUID
  from '@salesforce/apex/CometChatService.saveCometChatUID';
import isStartPlan from '@salesforce/apex/LimitCheckService.isStartPlan';

export default class CometChat extends LightningElement {
  _initialized = false;
  _listenerAttached = false;
  COMETCHAT = {};
  @track showUpgradeModal;
  @track isHome=true;


  async connectedCallback() {
     /* try {
            const isStart = await isStartPlan();
 
            // 🔴 BLOCK ENTIRE MODULE
            if (isStart ) {
                console.log('🚫 Start plan → block training  module');
                this.showUpgradeModal = true;
 
                // ❗ STOP EVERYTHING
                this.isHome = false;
           
 
                return;
            }
       
 
            } catch (error) {
                console.error('Error checking plan:', error);
                return;
            } */
    if (this._initialized) return;        
    this._initialized = true;             
    this.loadCredentials();
  }

  loadCredentials() {
    getCometChatCredentialsForCurrentUser()
      .then(result => {
        this.COMETCHAT = {
          appID: result.appID,
          appRegion: result.appRegion,
          authKey: result.authKey,
          variantID: result.variantID,
          userUID: result.userUID,
          restApiKey: result.restApiKey,
          userName: result.userName,
          userEmail: result.userEmail,
          userPhone: result.userPhone,
          userId: result.userId,
          userRole: result.userRole || 'default',
          avatar: result.avatarUrl || '',
          isDocked: true,
          width: '1100px',
          height: '500px',
          dockedAlignment: 'left'
        };

        console.log('[CometChat] Creds fetched:', this.COMETCHAT);

        this.ensureUserExists()
          .then(() => this.initializeCometChat())
          .catch(err => console.error('[CometChat] ensureUserExists error:', err));
      })
      .catch(error => {
        console.error('[CometChat] Error fetching creds:', error);
      });
  }

async ensureUserExists() {
  let { userUID, userId, userEmail } = this.COMETCHAT;
  if (!userUID) {
    console.log('[CometChat] No UID in Salesforce, generating...');
    userUID = this.generateUserUID(userId, userEmail);

    await this.createUser(userUID);
    await saveCometChatUID({ userId, userUID });
    console.log(`[CometChat] UID saved to Salesforce: ${userUID}`);

    this.COMETCHAT.userUID = userUID;
    localStorage.setItem(`cometchat_user_exists_${userUID}`, 'true');

    try {
      if (this.COMETCHAT.avatar) {
        localStorage.setItem(
          `cometchat_user_avatar_${userUID}`,
          this.COMETCHAT.avatar
        );
      }
    } catch (e) {
      console.warn('[CometChat] Failed to seed avatar cache on create:', e);
    }

    return;
  }

  const cacheKey = `cometchat_user_exists_${userUID}`;
  if (localStorage.getItem(cacheKey) === 'true') {
    console.log(`[CometChat] User ${userUID} cached as existing.`);
    await this.syncAvatarSmart();
    return;
  }

  console.log(
    `[CometChat] Using Salesforce UID: ${userUID}, marking as cached.`
  );
  localStorage.setItem(cacheKey, 'true');
  await this.syncAvatarSmart();
}




  async createUser(userUID) {
    const { appID, appRegion, restApiKey, userName, userEmail, userPhone, userRole,avatar } = this.COMETCHAT;

    const url = `https://${appID}.api-${appRegion}.cometchat.io/v3/users`;
    const body = {
  uid: userUID,
  name: userName || 'Portal User',
  role: userRole || 'default',
  statusMessage: 'Hey there! I am using CometChat.',
  metadata: {
    '@private': {
      email: userEmail || '',
      contactNumber: userPhone || ''
    }
  },
  tags: [],
  withAuthToken: true
};

if (avatar) {
  body.avatar = avatar;
}


    const options = {
      method: 'POST',
      headers: {
        apikey: restApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    };

    console.log('[CometChat] Preparing to create user...');
    console.log('👉 URL:', url);
    console.log('👉 Headers:', options.headers);
    console.log('👉 Body (parsed):', body);
    console.log('👉 Body (stringified):', options.body);

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CometChat] API Error Response:', errorText);
      throw new Error(`Failed to create user: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[CometChat] User created successfully:', data);
    return data;
  }

  generateUserUID(userId, userEmail) {
    let uid = `sf-${userId}`.toLowerCase();

    if (userEmail) {
      const emailPart = userEmail
        .split('@')[0]
        .replace(/[^a-z0-9]/gi, '')
        .toLowerCase();
      uid += `-${emailPart}`;
    }

    console.log(`[CometChat] Generated UID: ${uid}`);
    return uid;
  }

async fetchCometChatUser(userUID) {
  const { appID, appRegion, restApiKey } = this.COMETCHAT;

  const url = `https://${appID}.api-${appRegion}.cometchat.io/v3/users/${userUID}`;
  const options = {
    method: 'GET',
    headers: {
      apikey: restApiKey,
      'Content-Type': 'application/json'
    }
  };

  console.log('[CometChat] Fetching current CometChat user...', userUID);

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[CometChat] Failed to fetch user from CometChat:', errorText);
    return null;
  }

  const data = await response.json();
  console.log('[CometChat] Current CometChat user data:', data);
  return data;
}


async syncAvatarSmart() {
  const { userUID, avatar: staffAvatar } = this.COMETCHAT;

  if (!userUID) {
    console.log('[CometChat] No UID, cannot sync avatar.');
    return;
  }

  if (!staffAvatar) {
    console.log('[CometChat] No Staff avatar URL from Salesforce, skipping sync.');
    return;
  }

  const avatarCacheKey = `cometchat_user_avatar_${userUID}`;
  let cachedAvatar = null;

  try {
    cachedAvatar = localStorage.getItem(avatarCacheKey);
  } catch (e) {
    console.warn('[CometChat] Unable to access localStorage:', e);
  }

  console.log('[CometChat] Staff avatar     :', staffAvatar);
  console.log('[CometChat] Cached CC avatar :', cachedAvatar);

  if (cachedAvatar !== null) {
    if (cachedAvatar === staffAvatar) {
      console.log('[CometChat] Avatar unchanged (cache == Staff). Skipping update & GET.');
      return;
    }

    console.log('[CometChat] Avatar changed (cache != Staff). Updating CometChat...');
    await this.updateUserAvatar();

    try {
      localStorage.setItem(avatarCacheKey, staffAvatar);
      console.log('[CometChat] Avatar cache updated to Staff avatar.');
    } catch (e) {
      console.warn('[CometChat] Failed to write avatar cache:', e);
    }

    return;
  }

  console.log('[CometChat] No cached avatar yet. Fetching from CometChat once...');
  const userData = await this.fetchCometChatUser(userUID);
  const currentAvatar = userData?.data?.avatar || '';

  console.log('[CometChat] CometChat avatar :', currentAvatar);

  if (currentAvatar === staffAvatar) {
    console.log('[CometChat] Avatar already in sync (CC == Staff). Just caching, no update.');
    try {
      localStorage.setItem(avatarCacheKey, staffAvatar);
    } catch (e) {
      console.warn('[CometChat] Failed to write avatar cache:', e);
    }
    return;
  }

  console.log('[CometChat] Avatar different (CC != Staff). Updating CometChat...');
  await this.updateUserAvatar();

  try {
    localStorage.setItem(avatarCacheKey, staffAvatar);
    console.log('[CometChat] Avatar cache updated to Staff avatar.');
  } catch (e) {
    console.warn('[CometChat] Failed to write avatar cache:', e);
  }
}



async updateUserAvatar() {
  const { appID, appRegion, restApiKey, userUID, avatar } = this.COMETCHAT;

  if (!userUID || !avatar) {
    console.log('[CometChat] No UID or avatar, skipping avatar update.');
    return;
  }

  const url = `https://${appID}.api-${appRegion}.cometchat.io/v3/users/${userUID}`;
  const body = { avatar };

  const options = {
    method: 'PUT',
    headers: {
      apikey: restApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };

  console.log('[CometChat] Updating user avatar...');
  console.log('👉 URL:', url);
  console.log('👉 Body:', body);

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[CometChat] Avatar update error:', errorText);

    return;
  }

  const data = await response.json();
  console.log('[CometChat] Avatar updated successfully:', data);
}




  initializeCometChat() {
    try {
      const { appID, appRegion, authKey, userUID } = this.COMETCHAT;
      if (!appID || !appRegion || !authKey || !userUID) {
        throw new Error(
          'Missing required CometChat credentials (appId, appRegion, authKey, userUid).'
        );
      }

      const credentials = { appID, appRegion, authKey };
      const options = {
        targetElementID: 'cometChatMount',
        isDocked: this.COMETCHAT.isDocked,
        width: this.COMETCHAT.width,
        height: this.COMETCHAT.height,
        dockedAlignment: this.COMETCHAT.dockedAlignment
      };

      if (this.COMETCHAT.variantID) {
        options.variantID = this.COMETCHAT.variantID;
      }

      CometChatApp.init(credentials)
        .then(() => {
          console.log('[CometChat] Initialized');

          if (window.CometChat && CometChat.removeConnectionListener) {
            CometChat.removeConnectionListener('lwc-conn');
          }
          if (window.CometChat && CometChat.addConnectionListener) {
            CometChat.addConnectionListener('lwc-conn', {
              onConnected: () => console.log('ConnectionListener => On Connected'),
              onDisconnected: () => console.log('ConnectionListener => On Disconnected')
            });
            this._listenerAttached = true;
          }

          return CometChatApp.login({ uid: userUID });
        })
        .then(user => {
          console.log('[CometChat] Logged in as:', user.uid);
          return CometChatApp.launch(options);
        })
        .then(() => {
          console.log('[CometChat] Chat launched!');
        })
        .catch(error => {
          console.error('[CometChat] Error during init/login/launch:', error);
        });
    } catch (e) {
      console.error('[CometChat] Initialization error:', e);
    }
  }

  disconnectedCallback() {
    try {
      if (window.CometChat && CometChat.removeConnectionListener && this._listenerAttached) {
        CometChat.removeConnectionListener('lwc-conn');
        this._listenerAttached = false;
      }
      if (window.CometChatApp && CometChatApp.destroy) {
        CometChatApp.destroy();
      }
    } catch (e) {
      console.warn('[CometChat] Cleanup warning:', e);
    }
  }
}