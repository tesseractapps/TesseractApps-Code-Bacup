import { LightningElement, track, wire, api } from "lwc";
import { loadScript } from "lightning/platformResourceLoader";
import getFirestoreUsers from "@salesforce/apex/FirebaseUserService.getFirestoreUsers";
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import Firebase_API_Key from "@salesforce/label/c.FIREBASE_API_KEY";
import Firebase_Auth_Domain from "@salesforce/label/c.Firebase_Auth_Domain";
import Firebase_Project_ID from "@salesforce/label/c.Firebase_Project_ID";
import Firebase_Storage_Bucket from "@salesforce/label/c.Firebase_Storage_Bucket";
import Firebase_App_ID from "@salesforce/label/c.Firebase_App_ID";
import SendIcon from '@salesforce/resourceUrl/Send_Icon';
import getAllUsers  from "@salesforce/apex/FirebaseUserInt.getAllUsers";
import { refreshApex } from '@salesforce/apex';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';

export default class ChatApp extends LightningElement {
    @track isLoading = false;
    firebaseInitialized = false;
    @track sendIconUrl = SendIcon; 
    @track unreadMessagesCount = 0;
    @track orgusers = [];
    @track users = [];
    @track filteredUsers = [];
    @track searchQuery = "";
    @track selectedUserId = null;
    @track selectedUserName = '';
    @track messages = [];
    @track messageInput = '';
    @track currentUserName = "";
    @track currentUserNameAPI= "";
    @track currentUserAvatar = "";
    @track isSending = false;
    @track existingChats = []; // Users with messages
    @track newChats = []; // Users with no messages
    @track showNewChats = false;
    @track showEditPopup = false;
    @track filteredExistingChats = [];
    @track filteredNewChats = [];
    wiredFirestoreUsersData;
    messageInput = "";
    selectedUserId = null;
    chatId = "defaultChatRoom"; // Default chat room
    currentUserId=Id;
    unsubscribeMessages = null;
    @api orgfullname = '';
    @api orgid = '';
    @track searchQuerygc = "";
    @track filteredUsersForGroupgc = [];
    @track isCurrentUserAdmin = false;


    @track showEditModal = false;
    @track showDeleteModal = false;
    @track editingMessage = null;
    @track deletingMessageId = null;
    @track editedText = "";

    @track showGroupEditModal = false;
@track showGroupDeleteModal = false;
@track editingGroupMessageId = null;
@track deletingGroupMessageId = null;
@track editedGroupText = "";



    @track showGroupPopup = false;
    @track selectedGroupId = null;
    @track groupName = "";
    @track selectedUsersForGroup = [];
    @track groupChats = [];
    @track allUsersList = [];
    @track selectedUsersForGroup = [];
    @track groupName = "";
    @track showGroupMembers = false;
    @track groupParticipants = [];
    @track processedGroupParticipants = []; 
    @track randomColors = {};
    @track showOptionsMenu = false;
    @track isAdmin = false;
    @track groupAdminId = null;
    @track groupAdminId = '';
    @track processedUsersList = [];

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

    connectedCallback() {
        this.isLoading=true;
        console.log('📌 Received Org Name in Chatter:', this.orgfullname);
        console.log('📌 Received Org ID in Chatter:', this.orgid);
        
        if (!this.firebaseInitialized) {
            Promise.all([
                loadScript(this, "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"),
                loadScript(this, "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js")
                
            ])
                .then(() => {
                    this.initializeFirebase();
                    this.firebaseInitialized = true;
                    if (!this.users.length) {
                        this.initializeUsersInFirebase();
                    }
                    this.listenToUserChats();
                    this.listenToGroupChats();
                    this.fetchGroupChats();
                    this.checkAdminStatus();
                    this.processUsersList();
                })
                .catch((error) => {
                    console.error("Error loading Firebase", error);
                });
        }
        console.log("currentuser"+this.currentUserId);
        console.log("orgname"+this.currentUserId);
        this.filteredExistingChats = [...this.existingChats];
        this.filteredNewChats = [...this.newChats.filter(user => user.userId !== this.currentUserId)];
        console.log('📌 CHECK THIS OUT:', JSON.stringify(this.filteredExistingChats));
        if (this.wiredFirestoreUsersData) {
            refreshApex(this.wiredFirestoreUsersData);
            console.log("🔄 Wire data refreshed!");
        }
    }

    disconnectedCallback() {
        console.log("🔴 Component Disconnected: Cleaning up data");
    
        // ✅ Unsubscribe from real-time listeners
        if (this.unsubscribeUserChats) {
            this.unsubscribeUserChats();
            console.log("🔴 Unsubscribed from user chats listener.");
        }
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
            console.log("🔴 Unsubscribed from messages listener.");
        }

        if (this.wiredFirestoreUsersData) {
            refreshApex(this.wiredFirestoreUsersData); // ✅ Clears LDS cache for @wire
        }
    
        // ✅ Clear users to force refetch on next render
        this.users = [];
        this.filteredUsers = [];
        this.existingChats = [];
        this.newChats = [];
        this.filteredExistingChats = [];
        this.filteredNewChats = [];
    
        console.log("🧹 Cleared cached users & chat data");
    }
    
    
    
    
    
    
    listenToUserChats() {
        if (!this.currentUserId) {
            console.warn("⚠️ Current user ID not set, unable to listen for messages.");
            return;
        }
    
        console.log("👂 Listening to all user chats for:", this.currentUserId);
    
        // ✅ Real-time listener for user's chats
        this.unsubscribeUserChats = firebase.firestore()
            .collection("chats")
            .where("participants", "array-contains", this.currentUserId)
            .onSnapshot(snapshot => {
                let updatedUsers = [...this.users];
    
                snapshot.docChanges().forEach(change => {
                    const chatData = change.doc.data();
                    const chatId = change.doc.id;
                    let lastMessage = chatData.lastMessage || "No messages yet";
                    if (chatData.isLastMessageDeleted || lastMessage.trim() === "") {
                        lastMessage = "This message was deleted"; // 🔹 Override last message if deleted
                    }

                    const lastMessageAt = chatData.lastMessageAt ? new Date(chatData.lastMessageAt.toDate()) : null;
                    const formattedTime = lastMessageAt ? this.formatLastMessageTime(lastMessageAt) : "";
    
                    // ✅ Find the user that the chat is with
                    const otherUserId = chatData.participants.find(id => id !== this.currentUserId);
                    const userIndex = updatedUsers.findIndex(user => user.userId === otherUserId);
    
                    if (userIndex !== -1) {
                        updatedUsers[userIndex] = {
                            ...updatedUsers[userIndex],
                            lastMessage,
                            lastMessageAt,
                            lastMessageTime: formattedTime
                        };
                    }
                });
                this.fetchLastMessages();
                // ✅ Sort users based on latest message timestamp
                updatedUsers.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    
                // ✅ Update filtered users, ensuring current user is not included
                this.filteredUsers = updatedUsers.filter(user => user.userId !== this.currentUserId);
                console.log("✅ Real-time updated filtered users:", this.filteredUsers.map(user => user.name));
            });
    }

    @wire(getRecord, { recordId: Id, fields: [UserNameFld] }) 
    userDetails({ error, data }) {
        if (data) {
            this.currentUserNameAPI = data.fields.Name.value;
            console.log("✅ Current User Name:", this.currentUserNameAPI);
        } else if (error) {
            console.error("❌ Error fetching user name:", error);
        }
    }
    
    
    @wire(getFirestoreUsers)
wiredFirestoreUsers(result) {
    this.wiredFirestoreUsersData = result; // ✅ Save the wire response
    const { data, error } = result;

    if (data) {
        try {
            console.log("🔥 Raw Firestore Response:", JSON.stringify(data, null, 2));
            const parsedData = JSON.parse(data);
            if (parsedData.documents && Array.isArray(parsedData.documents)) {
                this.users = parsedData.documents
                    .map(doc => ({
                        env: doc.fields?.env?.stringValue || "Unknown env",
                        userId: doc.fields?.userId?.stringValue?.trim() || "", // ✅ Updated
                        orgId: doc.fields?.orgId?.stringValue || "Unknown org",
                        name: doc.fields?.name?.stringValue || "Unknown User", // ✅ Updated
                        avatar: doc.fields?.avatar?.stringValue || "", // ✅ Updated
                        email: doc.fields?.email?.stringValue || "", // ✅ Updated
                        isActive: doc.fields?.isActive?.booleanValue || false, // ✅ Updated
                        salesforceUserId: doc.fields?.salesforceUserId?.stringValue || "", // ✅ Updated
                        lastUpdated: doc.fields?.lastUpdated?.timestampValue || null, // ✅ Updated
                        lastMessage: "",
                        lastMessageAt: null
                    }))

                    console.log("✅ Firestore Users (Before Filtering):", JSON.stringify(this.users, null, 2));
                    this.users = this.users.filter(user => user.orgId === this.orgid);

            console.log("✅ Firestore Users (After Filtering):", JSON.stringify(this.users, null, 2));
            if (!this.users.length) {
                console.warn("⚠️ No users found in Firestore! Retrying in 2 seconds...");
                setTimeout(() => refreshApex(this.wiredFirestoreUsersData), 2000);
            }
            this.fetchCurrentUser();
            }
        } catch (e) {
            console.error("❌ Error parsing Firestore JSON:", e);
        }
    } else if (error) {
        console.error("❌ Error fetching Firestore users:", error);
    }
}



    // ✅ Fetch org users from Salesforce and send to Firestore
    @wire(getAllUsers)
wiredOrgUsers({ data, error }) {
    if (data) {
        try {
            console.log("✅ Users Fetched from Apex (wiredOrgUsers):", JSON.stringify(data, null, 2));
            const parsedData = JSON.parse(data);
            console.log("✅ Users Fetched from Apex:", parsedData);

            if (typeof parsedData === 'object' && parsedData !== null) {
                this.orgusers = Object.values(parsedData).flatMap(org => 
                    org.usersList.map(user => ({
                        userId: user.userId,  // ✅ Matches Firestore `userId`
                        name: `${user.firstname} ${user.lastname}`, // ✅ Full Name
                        email: user.email,
                        avatar: user.photoUrl || '',
                        orgId: org.organisationName,  // ✅ Matches Firestore `orgId`
                        env: org.env,  // ✅ Matches Firestore `env`
                        isActive: user.isActive, // ✅ Matches Firestore `isActive`
                        salesforceUserId: user.userId, // ✅ Matches Firestore `salesforceUserId`
                        lastUpdated: null, // ✅ Placeholder, Firestore will set timestamp
                        createdAt: null // ✅ Firestore will auto-generate this
                    }))
                );
            }

            console.log("✅ Formatted Org Users:", JSON.stringify(this.orgusers, null, 2));
            this.initializeUsersInFirebase(); // ✅ Send to Firestore
        } catch (error) {
            console.error("❌ Error parsing JSON from Apex:", error);
        }
    } else if (error) {
        console.error("❌ Error fetching org users from Apex:", error);
    }
}


async initializeUsersInFirebase() {
    if (!this.orgusers.length) {
        console.warn("⚠️ No users to initialize in Firebase.");
        return;
    }

    try {
        console.log("🔥 Initializing Users in Firestore:", JSON.stringify(this.orgusers, null, 2));
        const batch = firebase.firestore().batch();
        const usersRef = firebase.firestore().collection("users");

        // ✅ Fetch existing users in Firestore
        const existingUsersSnapshot = await usersRef
            .where('env', '==', this.orgusers[0]?.env)
            .where('orgId', '==', this.orgusers[0]?.orgId)
            .get();

        const existingUserIds = new Set(existingUsersSnapshot.docs.map(doc => doc.data().userId));
        
        let addedUsers = 0;

        this.orgusers.forEach(user => {
            const userRef = usersRef.doc(user.userId);
            
            const userData = {
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                userId: user.userId,
                orgId: user.orgId,
                env: user.env,
                isActive: user.isActive,
                salesforceUserId: user.salesforceUserId,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            };

            if (!existingUserIds.has(user.userId)) {
                console.log(`🆕 Adding User: ${user.name} (${user.userId})`);
                batch.set(userRef, {
                    ...userData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
                addedUsers++;
            } else {
                console.log(`🔄 Updating User: ${user.name} (${user.userId})`);
                batch.update(userRef, userData);
            }
        });

        if (addedUsers > 0) {
            await batch.commit();
            console.log(`✅ Successfully added/updated ${addedUsers} users in Firestore.`);
        } else {
            console.log("⚠️ No new users added. Users might already exist.");
        }
        setTimeout(() => {
            refreshApex(this.wiredFirestoreUsersData); // 🔄 Refresh Firestore Users
        }, 2000);
    } catch (error) {
        console.error("❌ Error initializing org users in Firebase:", error);
    }
}

    
    

    fetchCurrentUser() {
        if (!this.currentUserId) {
            console.warn("⚠️ Current User ID is not set yet. Waiting...");
            return;
        }
    
        if (!this.orgusers || this.orgusers.length === 0) {
            console.warn("⚠️ Org users list is empty. Fetching data first...");
            return;
        }
    
        console.log("📌 Current User ID:", `"${this.currentUserId}"`);
        console.log("📌 All Org Users:", JSON.stringify(this.orgusers, null, 2));
    
        // ✅ Find the current user in `orgusers`
        const currentUser = this.orgusers.find(user => user.userId === this.currentUserId);
    
        if (currentUser) {
            this.currentUserName = currentUser.name || "User";
            this.currentUserAvatar = currentUser.avatar || "";
            console.log(`✅ Current User Found: ${this.currentUserName}, Avatar: ${this.currentUserAvatar}`);
        } else {
            console.warn("⚠️ No matching user found for current user ID in orgusers.");
            this.currentUserName = "User";
            this.currentUserAvatar = "";
        }
    
        // ✅ Now filter users AFTER setting current user details
        this.isLoading=false;
        this.filterUsers();
    }
    
    
    
    

    filterUsers() {
        if (!this.users.length) {
            console.warn("⚠️ No users available to filter.");
            return;
        }
    
        console.log("📌 Filtering out Current User ID:", `"${this.currentUserId.trim()}"`);
    
        // ✅ Filter out the current user
        this.filteredUsers = this.users.filter(user => user.userId.trim() !== this.currentUserId.trim());
    
        console.log("✅ Filtered Users (Excluding Current User):", this.filteredUsers.map(user => user.name));
    
        // ✅ Force UI update to reflect changes
        this.filteredUsers = [...this.filteredUsers];
    
        // Fetch last messages after filtering
        this.fetchLastMessages();
    }
    
    
    

    async fetchLastMessages() {
        console.log("🔄 Fetching last messages for each user...");
        await this.ensureDefaultChatsExist();
    
        let usersWithMessages = [];
        let usersWithoutMessages = [];
    
        try {
            const chatSnapshots = await firebase.firestore()
                .collection('chats')
                .where('participants', 'array-contains', this.currentUserId)
                .get();
                console.log("🔥 Raw Chat Snapshots:", chatSnapshots.docs.map(doc => doc.data()));

            const chatMap = new Map();
    
            // ✅ Store chat details in a map for quick lookup
            chatSnapshots.docs.forEach(doc => {
                const chatData = doc.data();
                const otherUserId = chatData.participants.find(id => id !== this.currentUserId);
                chatMap.set(otherUserId, {
                    lastMessage: chatData.lastMessage || "",
                    lastMessageAt: chatData.lastMessageAt ? new Date(chatData.lastMessageAt.toDate()) : null,
                    lastMessageTime: chatData.lastMessageAt ? this.formatLastMessageTime(new Date(chatData.lastMessageAt.toDate())) : ""
                });
            });
    
            this.users.forEach(user => {
                if (user.userId === this.currentUserId) {
                    return; // ✅ Skip the current user
                }
    
                if (chatMap.has(user.userId) && chatMap.get(user.userId).lastMessageAt) {

                    // ✅ Existing chat found, add user to existing chats
                    let chatInfo = chatMap.get(user.userId);
    
                    if (chatInfo.lastMessage.trim()) {
                        usersWithMessages.push({ ...user, ...chatInfo });
                    } else {
                        usersWithoutMessages.push({ 
                            ...user,
                            lastMessage: "No messages yet",
                            lastMessageAt: null,
                            lastMessageTime: ""
                        });
                    }
                } else {
                    // ✅ No chat found, add user to new chat list
                    usersWithoutMessages.push({
                        ...user,
                        lastMessage: "No messages yet",
                        lastMessageAt: null,
                        lastMessageTime: ""
                    });
                }
            });
    
            // ✅ Sort users with messages by lastMessageAt (most recent first)
            usersWithMessages.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    
            // ✅ Update lists correctly
            this.existingChats = usersWithMessages;
            this.newChats = usersWithoutMessages.filter(user => user.userId !== this.currentUserId); // ✅ Remove current user
    
            // ✅ Ensure `filteredExistingChats` only contains users with messages
            this.filteredExistingChats = [...usersWithMessages];
    
            // ✅ Ensure `filteredNewChats` contains users without messages
            this.filteredNewChats = [...usersWithoutMessages];
    
            console.log("✅ Existing Chats (with messages):", this.filteredExistingChats.map(user => user.name));
            console.log("✅ New Chats (without messages):", this.filteredNewChats.map(user => user.name));
            
           this.isLoading=false;

    
        } catch (error) {
            console.error("❌ Error fetching last messages:", error);
            this.isLoading=false;
        }
    }
    
    
    async ensureDefaultChatsExist() {
        console.log("🔍 Checking for missing chat records...");
    
        // Fetch all users except the current user
        const missingChats = this.users.filter(user => 
            user.userId !== this.currentUserId
        );
    
        if (!missingChats.length) {
            console.warn("⚠️ No other users found. Skipping chat initialization.");
            return;
        }
    
        try {
            for (let user of missingChats) {
                const chatRef = firebase.firestore().collection("chats");
                
                // Check if chat already exists
                const existingChat = await chatRef
                    .where("participants", "array-contains", this.currentUserId)
                    .get();
    
                const chatExists = existingChat.docs.some(doc => 
                    doc.data().participants.includes(user.userId)
                );
    
                if (!chatExists) {
                    console.log(`🆕 Creating default chat for ${user.name}...`);
    
                    await chatRef.add({
                        participants: [this.currentUserId, user.userId],
                        lastMessage: "No messages yet",
                        lastMessageAt: null,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
            
            console.log("✅ Default chats initialized for users without a chat.");
    
        } catch (error) {
            console.error("❌ Error ensuring default chats exist:", error);
        }
    }
    

    sortAndUpdateFilteredUsers(usersWithMessages, usersWithoutMessages) {
        // ✅ Sort users with messages by lastMessageAt (most recent first)
        usersWithMessages.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    
        // ✅ Merge both lists
        this.filteredUsers = [...usersWithMessages, ...usersWithoutMessages]
            .filter(user => user.userId.trim() !== this.currentUserId.trim());
    
        console.log("✅ Sorted & Filtered Users:", this.filteredUsers.map(user => user.name));
    }
    
    
    
    
    
    formatLastMessageTime(timestamp) {
        if (!timestamp) return "";
    
        const now = new Date();
        const diffMs = now - timestamp;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
    
        if (diffMinutes < 1) return "Just now";
        if (diffMinutes < 60) return `${diffMinutes} min ago`;
        if (diffHours < 6) return `${diffHours} hr ago`;
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
    
        return timestamp.toLocaleDateString('en-GB'); // Format: DD/MM/YYYY
    }
    
    
    

    

    // Search functionality for filtering users
    handleSearch(event) {
        this.searchQuery = event.target.value.toLowerCase();
    
        if (this.searchQuery) {
            // Search in existing chats
            const existingStartsWith = this.existingChats.filter(user =>
                user.name.toLowerCase().startsWith(this.searchQuery)
            );
            const existingContains = this.existingChats.filter(user =>
                user.name.toLowerCase().includes(this.searchQuery) &&
                !user.name.toLowerCase().startsWith(this.searchQuery)
            );
    
            // Search in new chats
            const newStartsWith = this.newChats.filter(user =>
                user.name.toLowerCase().startsWith(this.searchQuery)
            );
            const newContains = this.newChats.filter(user =>
                user.name.toLowerCase().includes(this.searchQuery) &&
                !user.name.toLowerCase().startsWith(this.searchQuery)
            );
    
            // Update filtered lists dynamically
            this.filteredExistingChats = [...existingStartsWith, ...existingContains];
            this.filteredNewChats = [...newStartsWith, ...newContains];
    
        } else {
            // Reset search when query is empty
            this.filteredExistingChats = [...this.existingChats];
            this.filteredNewChats = [...this.newChats];
        }
    }
    





    // Select a user
    // Select a user to chat with
    @track showNewUserPopup = false; // Track popup visibility

// Toggle the new user popup
toggleNewUserPopup() {
    this.showNewUserPopup = !this.showNewUserPopup;
    console.log("New Chats Data:", JSON.stringify(this.filteredNewChats));
}
get toggleIcon() {
    return this.showNewUserPopup ? "action:back" : "action:new";
}

async selectNewUser(event) {
    event.stopPropagation();
    console.log("Event Dataset:", event.currentTarget.dataset);

    const userId = event.currentTarget.dataset.id; // ✅ Updated to `userId`
    console.log("🟢 Clicked User ID:", userId);

    // ✅ Clear input field when switching chats
    this.messageInput = "";
    const inputField = this.template.querySelector(".custom-message-input");
    if (inputField) {
        inputField.value = "";
        inputField.style.height = "auto"; // Reset input height
    }

    if (!userId || userId.trim() === "") {
        console.warn("⚠️ No user ID found in dataset.");
        return;

        
    }

    // ✅ Reset the current chat session
    this.selectedUserId = userId;
    this.selectedGroupId = null; // ✅ Ensure group chat is reset
    this.selectedGroupName = "";
    this.selectedGroupAvatar = "";
    this.groupParticipants = [];

    this.selectedUserId = userId;
    console.log("✅ Selected User ID Set:", this.selectedUserId);

    const user = this.newChats.find(u => u.userId === userId); // ✅ Updated to `userId`

    if (user) {
        this.selectedUserName = user.name;
        this.selectedUserAvatar = user.avatar || "";
        console.log("🆕 Starting new chat with:", this.selectedUserName);
    }

    try {
        const chatId = await this.createOrGetChat(this.currentUserId, userId);
        this.chatId = chatId;
        this.messages = [];
        this.listenToMessages(chatId);

        // ✅ Move user from newChats to existingChats
        this.newChats = this.newChats.filter(user => user.userId !== this.selectedUserId);
        this.existingChats = [...this.existingChats, user];

        // ✅ Hide New Chat Popup
        this.showNewUserPopup = false;
    } catch (error) {
        console.error("❌ Error selecting new user:", error);
    }
}


async selectUser(event) {
    event.stopPropagation(); // Prevent event bubbling

    const userId = event.currentTarget.dataset.id;
    console.log("🟢 Clicked User ID:", userId);

    if (!userId) {
        console.warn("⚠️ No user ID found in dataset.");
        return;
    }

    // ✅ Reset group selection
    this.selectedGroupId = null;
    this.selectedGroupName = "";
    this.selectedGroupAvatar = "";
    this.groupParticipants = [];

    // ✅ Clear input field when switching chats
    this.messageInput = "";
    const inputField = this.template.querySelector(".custom-message-input");
    if (inputField) {
        inputField.value = "";
        inputField.style.height = "auto"; // Reset input height
    }

    this.selectedUserId = userId;
    
    // ✅ Try to find the user in existing chats first
    let user = this.existingChats.find(u => u.userId === userId) || 
               this.newChats.find(u => u.userId === userId);

    if (!user) {
        console.warn("❌ User not found in chat lists. Fetching from Firestore...");
        
        try {
            const userDoc = await firebase.firestore()
                .collection("users")
                .where("userId", "==", userId)
                .get();

            if (!userDoc.empty) {
                userDoc.forEach(doc => {
                    user = doc.data();
                });
            } else {
                console.error("❌ User not found in Firestore.");
                return;
            }
        } catch (error) {
            console.error("❌ Error fetching user from Firestore:", error);
            return;
        }
    }

    // ✅ Set user details
    this.selectedUserName = user.name || "Unknown";
    this.selectedUserAvatar = user.avatar || "";
    console.log("💬 Chatting with:", this.selectedUserName);

    try {
        // ✅ Fetch Chat Messages for the User
        const chatId = await this.createOrGetChat(this.currentUserId, userId);
        this.chatId = chatId;
        this.messages = [];
        this.listenToMessages(chatId);

        // ✅ Ensure UI updates properly
        this.isSingleChatActive = true;
        this.isGroupChatActive = false;
    } catch (error) {
        console.error("❌ Error selecting user:", error);
    }
}




stopPropagation(event) {
    event.stopPropagation();
}

    


async createOrGetChat(currentUserId, otherUserId) {
    try {
        console.log('Checking for existing chat between:', currentUserId, otherUserId);

        if (!currentUserId || !otherUserId) {
            throw new Error(`Invalid user IDs: ${currentUserId}, ${otherUserId}`);
        }

        // ✅ Check if chat already exists
        const chatsSnapshot = await firebase.firestore()
            .collection('chats')
            .where('participants', 'array-contains', currentUserId)
            .get();

        const existingChat = chatsSnapshot.docs.find(doc => {
            const data = doc.data();
            return data.participants.includes(otherUserId);
        });

        if (existingChat) {
            console.log('✅ Existing chat found:', existingChat.id);
            return existingChat.id;
        }

        // ✅ If no chat exists, create a new one
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        const newChatRef = await firebase.firestore().collection('chats').add({
            createdAt: timestamp,
            lastMessage: "",
            lastMessageAt: null,
            participants: [currentUserId, otherUserId] // ✅ Correct chat structure
        });

        console.log('🚀 New chat created:', newChatRef.id);
        return newChatRef.id;

    } catch (error) {
        console.error('❌ Error in createOrGetChat:', error);
        throw error;
    }
}


get isSendDisabled() {
    return this.isSending || !this.messageInput.trim();
}

    // Handle message input
    handleMessageChange(event) {
        this.messageInput = event.target.value;
    
        const inputField = this.template.querySelector(".custom-message-input");
        if (inputField) {
            inputField.style.height = "auto";
            inputField.style.height = Math.min(inputField.scrollHeight, 150) + "px"; 
        }
    }
    
    

    
    // Send message (Firebase logic needed)
    async sendMessage() {
        if (this.isSendDisabled) return;
        if (!this.selectedUserId) {
            alert("⚠️ Select a user before sending a message.");
            return;
        }
    
        if (!this.messageInput.trim()) {
            alert("⚠️ Please enter a message before sending.");
            return;
        }
        this.isSending = true;
        try {
            // ✅ Ensure chat exists & get chatId
            const chatId = await this.createOrGetChat(this.currentUserId, this.selectedUserId);
            this.chatId = chatId;
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    
            const message = {
                chatId: chatId,
                senderId: this.currentUserId,
                senderName: this.getCurrentUserName(), // ✅ Sender Name stored, but NOT displayed
                text: this.messageInput.trim(),
                createdAt: timestamp,
                isEdited: false,
            };
    
            // ✅ Save message in Firestore
            const messageRef = await firebase.firestore().collection('messages').add(message);
    
            // ✅ Instantly update UI (Optimistic UI Update)
            this.messages = [
                ...this.messages,
                {
                    id: messageRef.id, // ✅ Use Firestore ID
                    text: this.messageInput.trim(),
                    senderClass: this.currentUserId === this.selectedUserId ? "message-received" : "message-sent",
                    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) // Display in HH:MM format
                }
            ];

    
            // ✅ Update chat document (Store last message details)
            await firebase.firestore().collection('chats').doc(chatId).set({
                lastMessage: message.text,
                lastMessageAt: timestamp,
                participants: [this.currentUserId, this.selectedUserId]
            }, { merge: true });
    
            console.log("✅ Message sent successfully:", message);
            
            this.messageInput = "";
        const inputField = this.template.querySelector(".custom-message-input");
        if (inputField) {
            inputField.value = "";
            inputField.style.height = "auto";
        }
            this.listenToUserChats();
    
        } catch (error) {
            console.error("❌ Error sending message:", error);
            alert("❌ Failed to send message. Please try again.");
        }finally {
            this.isSending = false; // Re-enable send button
            this.fetchLastMessages();
        }
    }
    
    handleKeyPress(event) {
        if (event.key === "Enter" && !event.shiftKey) { // Prevents new line on Shift + Enter
            event.preventDefault(); // Prevent default Enter behavior (new line)
            
            if (this.isSingleChatActive) {
                this.sendMessage(); // 🔹 Send message for single chat
            } else if (this.isGroupChatActive) {
                this.sendGroupMessage(); // 🔹 Send message for group chat
            }
        }
    }
    
    
    
    
    
    
    listenToMessages(chatId) {
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages(); // Unsubscribe from previous listener
        }
    
        console.log("📨 Listening to messages for chatId:", chatId);
    
        try {
            this.unsubscribeMessages = firebase.firestore()
                .collection("messages")
                .where("chatId", "==", chatId)
                .orderBy("createdAt")
                .onSnapshot(snapshot => {
                    let groupedMessages = [];
                    let lastDate = null;
                    let seenMessageIds = new Set();
                    let newMessagesCount = 0;
                    let shouldAutoScroll = this.isUserAtBottom(); // Check if user is at the bottom
    
                    snapshot.docs.forEach(doc => {
                        const data = doc.data();
                        const messageDate = data.createdAt ? new Date(data.createdAt.toDate()) : new Date();
                        let formattedDate = messageDate.toLocaleDateString('en-GB');
    
                        // ✅ Prevent duplicate messages
                        if (seenMessageIds.has(doc.id)) return;
                        seenMessageIds.add(doc.id);
    
                        if (formattedDate !== lastDate) {
                            groupedMessages.push({
                                id: `date-${formattedDate}`,
                                isDateSeparator: true,
                                text: formattedDate
                            });
                            lastDate = formattedDate;
                        }
    
                        let isNewMessage = this.messages.length > 0 && !this.messages.find(msg => msg.id === doc.id);
                        if (isNewMessage && !shouldAutoScroll) {
                            newMessagesCount++;
                        }
                        
    
                        const timeDiff = (new Date() - messageDate) / 1000; // Convert to seconds
                        let isEditable = !data.isDeleted && timeDiff < 300; // Editable for 5 minutes
    
                        // ✅ Ensure deleted messages do NOT show "(edited)"
                        let messageText = data.isDeleted ? "This message was deleted" : data.text;
    
                        groupedMessages.push({
                            id: doc.id,
                            text: messageText,
                            senderClass: data.senderId === this.currentUserId ? "message-sent" : "message-received",
                            timestampClass: data.senderId === this.currentUserId ? "timestamp timestamp-right" : "timestamp timestamp-left",
                            createdAt: messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            isEdited: !data.isDeleted && data.isEdited, // ✅ Hide (edited) if message is deleted
                            isDeleted: data.isDeleted || false, // ✅ Show "This message was deleted"
                            className: data.isDeleted ? "deleted-message" : "",
                            isEditable: isEditable, // ✅ Allow editing if within 5 minutes
                            isSender: data.senderId === this.currentUserId, // ✅ Check if current user is the sender
                            showOptions: !data.isDeleted && data.senderId === this.currentUserId
                        });
                    });

                    
    
                    this.messages = groupedMessages;
                    this.listenToUserChats();
                    this.fetchLastMessages();
    
                    setTimeout(() => {
                        if (shouldAutoScroll) {
                            this.scrollToBottom(); // Auto-scroll if user is already at the bottom
                        } else if (newMessagesCount > 0) {
                            this.unreadMessagesCount = newMessagesCount; // Update unread message count
                        }
                    }, 200);
                });
        } catch (error) {
            console.error("❌ Error setting up Firestore listener:", error);
        }
    }
    
    

    // ✅ Scroll to last message when user selects a chat
    scrollToBottom() {
        setTimeout(() => {
            const messagesContainer = this.isGroupChatActive
                ? this.template.querySelector(".group-messages-container")
                : this.template.querySelector(".messages-container");
    
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                this.unreadMessagesCount = 0; // ✅ Reset unread message count
            }
        }, 200);
    }
    

    // ✅ Check if user is at the bottom of the chat
    isUserAtBottom() {
        const messagesContainer = this.isGroupChatActive
            ? this.template.querySelector(".group-messages-container")
            : this.template.querySelector(".messages-container");
    
        if (!messagesContainer) return false;
    
        return Math.abs(messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight) < 5;
    }
    

    // ✅ Handle scrolling: Show unread messages button if not at bottom
    handleScroll() {
        if (this.isUserAtBottom()) {
            this.unreadMessagesCount = 0; // Reset unread messages when user scrolls to bottom
        }
    }

    // ✅ When user clicks "New Messages" button, scroll to latest messages
    handleUnreadMessagesClick() {
        this.scrollToBottom();
    }
    
    
    
    
    

    getCurrentUserName() {
        const currentUser = this.users.find(user => user.userId === this.currentUserId);
        return currentUser ? currentUser.name : "Unknown User";
    }

    getTimestampClass(msg) {
        return msg.senderClass === "message-sent" ? "timestamp timestamp-right" : "timestamp timestamp-left";
    }
    
    
    
    initializeFirebase() {
        const firebaseConfig = {
            apiKey: Firebase_API_Key,
            authDomain: Firebase_Auth_Domain,
            projectId: Firebase_Project_ID,
            storageBucket: Firebase_Storage_Bucket,
            appId: Firebase_App_ID
        };

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        this.db = firebase.firestore();
       // this.subscribeToMessages();
        console.log("🔥 Firebase Initialized with Custom Labels");
    }

    

    

    getChatId() {
        return [this.currentUserId, this.selectedUserId].sort().join("_");
    }




    //Group Chat


    fetchAllUsers() {
        if (!this.users.length) {
            console.warn("⚠️ No users available for group selection.");
            return;
        }
    
        // ✅ Combine all users into the list (existing + new)
        this.allUsersList = this.users.map(user => ({
            id: user.userId, // ✅ Ensure this uses the correct field from Firestore
            name: user.name,
            avatar: user.avatar || "",
            isMandatory: user.userId === this.currentUserId // ✅ Ensure creator is always in the group
        }));
    
        // ✅ Log all users with their IDs
        console.log("🔍 All Users Available for Group Chat:");
        this.allUsersList.forEach(user => {
            console.log(`🆔 ID: ${user.id}, 👤 Name: ${user.name}`);
        });
    }
    
    

    toggleGroupPopup() {
        this.fetchAllUsers(); // ✅ Ensure users are loaded before showing popup
        this.showGroupPopup = !this.showGroupPopup;
        this.filteredUsersForGroupgc = [...this.allUsersList];
        // ✅ Log all users in the list with their IDs
        console.log("🔍 All Users Available for Group Chat:");
        this.allUsersList.forEach(user => {
            console.log(`🆔 ID: ${user.id}, 👤 Name: ${user.name}`);
        });
    }
    
    toggleGroupMembers() {
        if (!this.selectedGroupId) {
            console.warn("⚠️ No selected group to show members.");
            return;
        }
    
        console.log("🔄 Toggling group members for:", this.selectedGroupName);
        console.log("📌 Group Participants List:", this.groupParticipants);
    
        this.showGroupMembers = !this.showGroupMembers;
    
        if (this.showGroupMembers) {
            this.processedGroupParticipants = this.groupParticipants.map(memberId => {
                let user = this.users.find(user => user.userId === memberId); // ✅ Use userId instead of id
                return {
                    id: memberId,
                    name: user ? user.name : "❌ Unknown User"
                };
            });
    
            console.log("👥 Processed Group Participants:");
            this.processedGroupParticipants.forEach(participant => {
                console.log(`🆔 ID: ${participant.id}, 👤 Name: ${participant.name}`);
            });
        }
    }

get getUserNames() {
    let userMap = {};
    this.users.forEach(user => {
        userMap[user.id] = user.name;
    });
    return userMap;
}

    
    handleGroupNameChange(event) {
        this.groupName = event.target.value;
    }

    @track searchQuerygc = "";
    @track filteredUsersForGroupgc = [];
    handleUserSelection(event) {
        const userId = event.target.dataset.id;
    
        if (event.target.checked) {
            this.selectedUsersForGroup.push(userId);
        } else {
            this.selectedUsersForGroup = this.selectedUsersForGroup.filter(id => id !== userId);
        }
    
        // ✅ Ensure the creator (Admin) is always selected
        if (!this.selectedUsersForGroup.includes(this.currentUserId)) {
            this.selectedUsersForGroup.push(this.currentUserId);
        }
    
        console.log("✅ Selected Users for Group:", this.selectedUsersForGroup);
    }
// ✅ Search Functionality
handleSearchgc(event) {
    this.searchQuery = event.target.value.toLowerCase().trim();

    if (this.searchQuery) {
        this.filteredUsersForGroupgc = this.allUsersList.filter(user =>
            user.name.toLowerCase().includes(this.searchQuery)
        );
    } else {
        this.filteredUsersForGroupgc = [...this.allUsersList]; // Reset when empty
    }

    console.log("🔍 Filtered Users:", this.filteredUsersForGroupgc.map(user => user.name));
}

    async createGroupChat() {
        if (!this.groupName.trim()) {
            alert("⚠️ Group Name is required!");
            return;
        }
        if (this.selectedUsersForGroup.length < 2) {
            alert("⚠️ Select at least 2 users!");
            return;
        }
    
        try {
            // ✅ Ensure admin is included **only once**
            const participants = Array.from(new Set([...this.selectedUsersForGroup, this.currentUserId]));
    
            console.log("📌 Creating Group with Participants:", participants);
    
            // ✅ Create Group in Firestore
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const newGroupRef = await firebase.firestore().collection('groupChats').add({
                name: this.groupName,
                participants: participants,
                admin: this.currentUserId, // ✅ Store admin ID
                env: this.orgusers.length > 0 ? this.orgusers[0].env : "Unknown Env", // ✅ Include env
                orgId: this.orgid, // ✅ Include orgId
                createdAt: timestamp,
                lastMessage: "",
                lastMessageAt: null
            });
    
            console.log("✅ Group Chat Created:", newGroupRef.id);
    
            // ✅ Fetch the latest group chats immediately
            this.listenToGroupChats();
    
            // ✅ Reset Form
            this.groupName = "";
            this.selectedUsersForGroup = [];
            this.showGroupPopup = false;
    
        } catch (error) {
            console.error("❌ Error creating group chat:", error);
        }
    }
    
    
    
    



async fetchGroupChats() {
    try {
        if (!this.currentUserId || typeof this.currentUserId !== "string") {
            console.warn("⚠️ fetchGroupChats: Current user ID is invalid or not set:", this.currentUserId);
            return;
        }

        console.log("🔄 Fetching existing group chats for user:", `"${this.currentUserId}"`);

        const groupSnapshots = await firebase.firestore()
            .collection("groupChats")
            .where("participants", "array-contains", this.currentUserId.trim()) // 🔥 Ensure ID matches exactly
            .get();

        if (groupSnapshots.empty) {
            console.warn("⚠️ No group chats found for this user:", `"${this.currentUserId}"`);
            this.groupChats = [];
            return;
        }

        // ✅ Map fetched groups
        this.groupChats = groupSnapshots.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                participants: data.participants,
                lastMessage: data.lastMessage || "No messages yet", // ✅ Updated
                lastMessageAt: data.lastMessageAt ? new Date(data.lastMessageAt.toDate()) : null,
                lastMessageTime: data.lastMessageAt ? this.formatLastMessageTime(new Date(data.lastMessageAt.toDate())) : "", // ✅ Updated
                admin: data.admin
            };
        });

        // ✅ Sort by `lastMessageAt` in descending order
        this.groupChats.sort((a, b) => {(b.lastMessageAt || 0) - (a.lastMessageAt || 0);
        });

        console.log("✅ Group Chats Loaded:", JSON.stringify(this.groupChats));

        // ✅ Force UI update
        this.groupChats = [...this.groupChats];

    } catch (error) {
        console.error("❌ Error fetching group chats:", error);
    }
}





    
async selectGroupChat(event) {
    const groupId = event.currentTarget.dataset.id;
    if (!groupId) {
        console.warn("⚠️ No group ID found in dataset.");
        return;
    }

    

    this.selectedUserId = null;
    this.selectedUserName = "";
    this.selectedUserAvatar = "";
    this.messages = [];


    // ✅ Clear input field when switching chats
    this.messageInput = "";
    const inputField = this.template.querySelector(".custom-message-input");
    if (inputField) {
        inputField.value = "";
        inputField.style.height = "auto"; // Reset input height
    }
    this.selectedGroupId = groupId; // ✅ Ensure this is set
    console.log("💬 Selected Group:", this.selectedGroupId);

    const group = this.groupChats.find(g => g.id === groupId);
    if (!group) {
        console.error("❌ Group not found in groupChats list.");
        return;
    }

    this.selectedGroupName = group.name;
    this.selectedGroupAvatar = group.avatar || "";
    this.groupParticipants = group.participants;
    this.groupAdminId = group.admin;

    this.isCurrentUserAdmin = this.groupAdminId === this.currentUserId;
    console.log("👑 Admin Status:", this.isCurrentUserAdmin);

    this.processedGroupParticipants = this.groupParticipants.map(memberId => {
        let user = this.users.find(user => user.id === memberId);
        return {
            id: memberId,
            name: user ? user.name : "Unknown User"
        };
    });

    try {
        this.chatId = groupId;
        this.messages = [];
        this.listenToGroupMessages(groupId);
    } catch (error) {
        console.error("❌ Error selecting group chat:", error);
    }
}






get isSingleChatActive() {
    return this.selectedUserId !== null && this.selectedGroupId === null;
}

get isGroupChatActive() {
    return this.selectedGroupId !== null && this.selectedUserId === null;
}

get isNoChatSelected() {
    return (!this.selectedUserId && !this.selectedGroupId);
}



getRandomColor() {
    const colors = [
        "#ff3b30", "#ff9500", "#ffcc00", "#4cd964", "#5ac8fa", 
        "#007aff", "#5856d6", "#ff2d55", "#34c759", "#af52de"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}



    
listenToGroupMessages(groupId) {
    if (this.unsubscribeMessages) {
        this.unsubscribeMessages();
    }

    console.log("📨 Listening to group messages for:", groupId);

    this.unsubscribeMessages = firebase.firestore()
        .collection("groupMessages")
        .where("chatId", "==", groupId)
        .orderBy("createdAt")
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                console.warn("⚠️ No messages found for this group.");
                this.messages = [];
                return;
            }

            let groupedMessages = [];
            let lastDate = null;
            let seenMessageIds = new Set();
            let newMessagesCount = 0;
            let shouldAutoScroll = this.isUserAtBottom();
            let lastMessage = "No messages yet"; // ✅ Default last message
            let lastMessageAt = null;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (!data || (!data.text && !data.pollQuestion) || !data.senderId) {
                    console.warn("⚠️ Skipping invalid message:", doc.id);
                    return;
                }

                const messageDate = data.createdAt ? new Date(data.createdAt.toDate()) : new Date();
                let formattedDate = messageDate.toLocaleDateString('en-GB');
                let formattedTime = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                if (formattedDate !== lastDate) {
                    groupedMessages.push({
                        id: `date-${formattedDate}`,
                        isDateSeparator: true,
                        text: formattedDate
                    });
                    lastDate = formattedDate;
                }
                let isSender = data.senderId === this.currentUserId;
                let senderClass = isSender ? "message-sent-poll" : "message-received-poll";

                // ✅ Check if new message
                let isNewMessage = this.messages.length > 0 && !this.messages.find(msg => msg.id === doc.id);
                if (isNewMessage && !shouldAutoScroll) {
                    newMessagesCount++;
                }
                console.log(`💬 [LOG] Message: ${data.text || data.pollQuestion}`);
                console.log(`🔄 [LOG] Sender Class: ${senderClass}`);
                // ✅ Handle Polls Separately
                if (data.isPoll) {
                    let computedClass = `message-wrapper ${senderClass}`;
                    
                    groupedMessages.push({
                        id: doc.id,
                        isPoll: true,
                        senderName: data.senderName, // ✅ Ensure Sender Name is Set
                        pollQuestion: data.pollQuestion,
                        pollOptions: data.pollOptions.map(opt => ({
                            value: opt.value,
                            votes: opt.votes,
                            votersText: opt.voters ? `Voted: ${opt.voters.join(", ")}` : "No votes yet",
                            voters: opt.voters || [],
                            showVoters: false 
                        })),
                        userVoted: data.votedUsers ? data.votedUsers.includes(this.currentUserId) : false,
                        isSender: isSender,
                        senderClass: senderClass,
                        computedClass: computedClass,
                        timestampClass: isSender ? "timestamp timestamp-right" : "timestamp timestamp-left",
                        createdAt: formattedTime,
                        isPollDeleted: data.isPollDeleted || false,
                        showOptions: isSender && !data.isPollDeleted
                    });

                    return;
                }

                // ✅ Allow editing only for messages sent within 5 minutes
                const timeDiff = (new Date() - messageDate) / 1000; // Convert to seconds
                let isEditable = !data.isDeleted && timeDiff < 300; // Editable for 5 minutes

                // ✅ If message was deleted, show only "This message was deleted"
                let messageText = data.isDeleted ? "This message was deleted" : data.text;

                if (!data.isDeleted && data.senderId !== "SYSTEM") {
                    lastMessage = messageText;
                    lastMessageAt = messageDate;
                }

                // ✅ If SYSTEM message (join/leave), show as separator
                if (data.senderId === "SYSTEM") {
                    groupedMessages.push({
                        id: doc.id,
                        isDateSeparator: true,
                        text: data.text
                    });
                } else {
                    groupedMessages.push({
                        id: doc.id,
                        text: messageText,
                        isDeleted: data.isDeleted || false,
                        senderName: data.senderName,
                        isSender: data.senderId === this.currentUserId,
                        senderClass: data.senderId === this.currentUserId ? "message-sent" : "message-received",
                        timestampClass: data.senderId === this.currentUserId ? "timestamp timestamp-right" : "timestamp timestamp-left",
                        createdAt: messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isEdited: !data.isDeleted && data.isEdited, // ✅ Hide (edited) if message is deleted
                        isDeleted: data.isDeleted || false, // ✅ Track deleted messages
                        isEditable: isEditable,
                        showOptions: !data.isDeleted && data.senderId === this.currentUserId, // ✅ Hide edit/delete if deleted
                        className: data.isDeleted ? "deleted-message" : ""
                    });
                }
            });

            
            this.messages = [...groupedMessages];
            setTimeout(() => {
                if (shouldAutoScroll) {
                    this.scrollToBottom(); // ✅ Auto-scroll if user was at the bottom
                } else if (newMessagesCount > 0) {
                    this.unreadMessagesCount = newMessagesCount; // ✅ Update unread message count
                }
            }, 200);
            if (lastMessageAt) {
                firebase.firestore().collection("groupChats").doc(groupId).update({
                    lastMessage: lastMessage,
                    lastMessageAt: firebase.firestore.Timestamp.fromDate(lastMessageAt)
                }).then(() => {
                    console.log(`✅ Updated last message in group chat: "${lastMessage}"`);
                }).catch(error => {
                    console.error("❌ Error updating last message:", error);
                });
            }
            requestAnimationFrame(() => {
                setTimeout(() => {
                    const messageWrappers = this.template.querySelectorAll(".message-wrapper");
                    console.log("🟢 Found", messageWrappers.length, "message-wrapper elements.");
                    messageWrappers.forEach((msg) => {
                        console.log("🟢 Applied Classes:", msg.classList);
                    });
                }, 100);
            });
            console.log("✅ Updated Group Messages:", this.messages);
            this.listenToGroupChats();
            this.fetchGroupChats();
        }, error => {
            console.error("❌ Firestore listener error:", error);
        });
}
showVotersList(event) {
    const pollId = event.target.dataset.id;
    const optionValue = event.target.dataset.option;

    this.messages = this.messages.map(msg => {
        if (msg.id === pollId) {
            msg.pollOptions = msg.pollOptions.map(opt => ({
                ...opt,
                showVoters: opt.value === optionValue ? true : opt.showVoters
            }));
        }
        return msg;
    });
}

hideVotersList(event) {
    const pollId = event.target.dataset.id;
    const optionValue = event.target.dataset.option;

    this.messages = this.messages.map(msg => {
        if (msg.id === pollId) {
            msg.pollOptions = msg.pollOptions.map(opt => ({
                ...opt,
                showVoters: opt.value === optionValue ? false : opt.showVoters
            }));
        }
        return msg;
    });
}


// ✅ Handle Voting in Poll
async votePollOption(event) {
    const pollId = event.target.dataset.id;
    const selectedOption = event.target.dataset.option;

    try {
        const pollRef = firebase.firestore().collection("groupMessages").doc(pollId);
        const pollDoc = await pollRef.get();

        if (pollDoc.exists) {
            const pollData = pollDoc.data();

            // ✅ Prevent multiple votes
            if (pollData.votedUsers && pollData.votedUsers.includes(this.currentUserId)) {
                alert("⚠️ You have already voted!");
                return;
            }

            const updatedOptions = pollData.pollOptions.map(opt =>
                opt.value === selectedOption
                    ? { ...opt, votes: opt.votes + 1, voters: [...(opt.voters || []), this.currentUserName] }
                    : opt
            );

            const updatedVotedUsers = [...(pollData.votedUsers || []), this.currentUserId];

            await pollRef.update({
                pollOptions: updatedOptions,
                votedUsers: updatedVotedUsers
            });

            console.log("✅ Poll Vote Updated:", selectedOption);
        }
    } catch (error) {
        console.error("❌ Error voting in poll:", error);
    }
}



getMessageClass(msg) {
    return msg.isDeleted ? "deleted-message" : "";
}




async sendGroupMessage() {
    if (this.isSending || !this.messageInput.trim()) return;

    if (!this.selectedGroupId) {
        alert("⚠️ Select a group before sending a message.");
        return;
    }

    this.isSending = true;
    try {
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();

        const message = {
            chatId: this.selectedGroupId,
            senderId: this.currentUserId,
            senderName: this.currentUserName,
            text: this.messageInput.trim(),
            createdAt: timestamp
        };

        // ✅ Optimistically add message to UI before Firestore responds
        const tempMessage = {
            id: Math.random().toString(), // Temporary ID
            text: message.text,
            senderName: message.senderName,
            senderClass: "message-sent",
            timestampClass: "timestamp timestamp-right",
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        this.messages = [...this.messages, tempMessage]; // ✅ Update UI instantly
        this.scrollToBottom();

        await firebase.firestore().collection("groupMessages").add(message);
        console.log("✅ Group Message Sent:", message);
        await firebase.firestore().collection("groupChats").doc(this.selectedGroupId).update({
            lastMessage: message.text,
            lastMessageAt: timestamp
        });
        console.log("✅ Group Chat Updated with Last Message");

        this.messageInput = "";
        const inputField = this.template.querySelector(".custom-message-input");
        if (inputField) {
            inputField.value = "";
            inputField.style.height = "auto"; // Reset height to prevent overflow
        }
        this.listenToGroupMessages(this.selectedGroupId); // ✅ Ensure real-time updates

    } catch (error) {
        console.error("❌ Error sending group message:", error);
    } finally {
        this.isSending = false;
    }
}




    get isNoChatSelected() {
        return !this.selectedUserId && !this.selectedGroupId;
    }

    listenToGroupChats() {
        if (!this.currentUserId) {
            console.warn("⚠️ Current user ID not set, unable to listen for group chats.");
            return;
        }
    
        console.log("👂 Listening to group chats for:", this.currentUserId);
    
        this.unsubscribeGroupChats = firebase.firestore()
            .collection("groupChats")
            .where("participants", "array-contains", this.currentUserId)
            .onSnapshot(snapshot => {
                let updatedGroups = [];
    
                snapshot.docs.forEach(doc => {
                    const groupData = doc.data();
                    let groupId = doc.id;
    
                    let lastMessage = groupData.lastMessage || "No messages yet";
                    let lastMessageAt = groupData.lastMessageAt ? new Date(groupData.lastMessageAt.toDate()) : null;
    
                    // ✅ Listen for real-time group messages
                    firebase.firestore()
                        .collection("groupMessages")
                        .where("chatId", "==", groupId)
                        .orderBy("createdAt", "desc")
                        .limit(1) // Only fetch the latest message
                        .onSnapshot(messageSnapshot => {
                            if (!messageSnapshot.empty) {
                                messageSnapshot.forEach(msgDoc => {
                                    const messageData = msgDoc.data();
    
                                    // ✅ Update last message only if it's not deleted
                                    lastMessage = messageData.isDeleted ? "This message was deleted" : messageData.text;
                                    lastMessageAt = messageData.createdAt ? new Date(messageData.createdAt.toDate()) : null;
                                });
                            }
    
                            // ✅ Update the group list with latest message
                            let existingGroupIndex = updatedGroups.findIndex(g => g.id === groupId);
                            if (existingGroupIndex !== -1) {
                                updatedGroups[existingGroupIndex] = {
                                    ...updatedGroups[existingGroupIndex],
                                    lastMessage,
                                    lastMessageAt
                                };
                            } else {
                                updatedGroups.push({
                                    id: groupId,
                                    name: groupData.name,
                                    participants: groupData.participants,
                                    lastMessage,
                                    lastMessageAt,
                                    admin: groupData.admin
                                });
                            }
    
                            // ✅ Sort groups by lastMessageAt (most recent first)
                            updatedGroups.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    
                            // ✅ Update state with real-time changes
                            this.groupChats = [...updatedGroups];
                            console.log("✅ Real-time updated group chats:", this.groupChats.map(g => g.name));
                        });
                });
            }, error => {
                console.error("❌ Firestore listener error:", error);
            });
    }
    
    
    
    
    
    leaveGroupChat() {
        if (confirm("Are you sure you want to leave this group?")) {
            firebase.firestore().collection("groupChats").doc(this.selectedGroupId)
                .update({
                    participants: firebase.firestore.FieldValue.arrayRemove(this.currentUserId)
                })
                .then(() => {
                    console.log("✅ Successfully left the group");
                    this.addSystemMessage(`${this.currentUserName} left the group.`);
                    this.selectedGroupId = null;
                    this.showOptionsMenu = false;
                    this.listenToGroupChats();
                })
                .catch(error => {
                    console.error("❌ Error leaving group:", error);
                });
        }
    }

    get isCurrentUserAdmin() {
        return this.groupAdminId === this.currentUserId;
    }
    
    // ✅ Toggle options menu
    toggleOptionsMenu(event) {
        event.stopPropagation();
        this.showOptionsMenu = !this.showOptionsMenu;
    }
    
    // ✅ Close menu when clicking outside
    handleClickOutside(event) {
        if (!this.template.querySelector(".options-menu-container").contains(event.target)) {
            this.showOptionsMenu = false;
        }
    }
    
    checkAdminStatus() {
        if (!this.selectedGroupId || !this.groupChats.length) return;
    
        const group = this.groupChats.find(g => g.id === this.selectedGroupId);
        if (group) {
            this.groupAdminId = group.admin; // ✅ Store admin ID
            this.isCurrentUserAdmin = this.groupAdminId === this.currentUserId; // ✅ Check if user is admin
        }
    }
    
    
    // ✅ Edit Participants (Admin Only)
    editGroupParticipants() {
        if (!this.isAdmin) {
            alert("⚠️ Only the group admin can edit participants.");
            return;
        }
        this.showEditPopup = true;
    }

    addSystemMessage(message) {
        firebase.firestore().collection("groupMessages").add({
            chatId: this.selectedGroupId,
            senderId: "SYSTEM",
            senderName: "System",
            text: message,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    isUserSelected(userId) {
        return this.groupParticipants.includes(userId);
    }
    
    // ✅ Ensure admin is always disabled
    isUserAdmin(userId) {
        return userId === this.groupAdminId;
    }
    closeEditUserModal(){
        this.showEditPopup = false;
    }
    
    toggleEditPopup() {
        if (!this.selectedGroupId) {
            console.warn("⚠️ No selected group to edit participants.");
            return;
        }
    
        const group = this.groupChats.find(g => g.id === this.selectedGroupId);
        if (!group) {
            console.error("❌ Group not found!");
            return;
        }
    
        // ✅ Ensure only the admin can edit participants
        if (group.admin !== this.currentUserId) {
            alert("⚠️ Only the group admin can edit participants.");
            return;
        }
    
        // ✅ Store the admin ID
        this.groupAdminId = group.admin;
        console.log("👑 Group Admin ID:", this.groupAdminId);
    
        this.isAdmin = true; // ✅ Mark current user as admin
        this.groupParticipants = [...group.participants]; // ✅ Load participants
    
        // ✅ Ensure Admin is Always in the List
        if (!this.groupParticipants.includes(this.groupAdminId)) {
            console.warn("⚠️ Admin was missing from participants! Re-adding admin...");
            this.groupParticipants.push(this.groupAdminId);
        }
    
        // ✅ Process users list for the UI
        this.processUsersList();
    
        this.showEditPopup = true;
        console.log("🟢 Edit Popup Toggled:", this.showEditPopup);
    }
    
    
    // ✅ Process user list for participant selection
    processUsersList() {
        console.log("🔄 Processing Users List for Group Edit...");
    
        this.processedUsersList = this.users.map(user => ({
            id: user.userId,
            name: user.name,
            isSelected: this.groupParticipants.includes(user.userId),
            isAdmin: user.userId === this.groupAdminId
        }))
        .sort((a, b) => b.isAdmin - a.isAdmin); // ✅ Keep Admin on top
    
        console.log("✅ Processed Users List (Admin First):", JSON.stringify(this.processedUsersList, null, 2));
    }
    
    
    
    
    // ✅ Add or Remove Users (Admin Only)
    handleAdminUserSelection(event) {
        const userId = event.target.dataset.id;
        if (!userId) return;
    
        if (userId === this.groupAdminId) {
            alert("⚠️ The group admin cannot be removed.");
            event.target.checked = true; // ✅ Keep admin checked in UI
            return;
        }
    
        if (event.target.checked) {
            // ✅ Add user if selected
            if (!this.groupParticipants.includes(userId)) {
                this.groupParticipants.push(userId);
            }
        } else {
            // ✅ Remove user if deselected
            this.groupParticipants = this.groupParticipants.filter(id => id !== userId);
        }
    
        this.processUsersList(); // ✅ Update UI
    }
    
    
    
    
    
    // ✅ Save Participant Changes to Firestore
    async saveGroupChanges() {
        if (!this.selectedGroupId) {
            console.error("❌ No group selected!");
            return;
        }
    
        try {
            console.log("🔄 Saving group participant updates...");
    
            // ✅ Ensure the admin is always in the group before saving
            if (!this.groupParticipants.includes(this.groupAdminId)) {
                console.warn("⚠️ Admin cannot be removed. Re-adding admin to group.");
                this.groupParticipants.push(this.groupAdminId);
            }
    
            // 🔹 Fetch current group data to compare changes
            const groupRef = firebase.firestore().collection("groupChats").doc(this.selectedGroupId);
            const groupDoc = await groupRef.get();
    
            if (!groupDoc.exists) {
                console.error("❌ Group document not found in Firestore.");
                return;
            }
    
            const previousParticipants = groupDoc.data().participants || [];
    
            // ✅ Find added users
            const addedUsers = this.groupParticipants.filter(user => !previousParticipants.includes(user));
            
            // ✅ Find removed users
            const removedUsers = previousParticipants.filter(user => !this.groupParticipants.includes(user));
    
            // ✅ Update Firestore with the new participants list
            await groupRef.update({
                participants: this.groupParticipants
            });
    
            console.log("✅ Group participants updated successfully!");
    
            // ✅ Construct separate system messages
            if (addedUsers.length > 0) {
                const addedNames = addedUsers.map(userId => this.getUserNameById(userId)).join(", ");
                this.addSystemMessage(`${this.currentUserName} added ${addedNames}`);
            }
            if (removedUsers.length > 0) {
                const removedNames = removedUsers.map(userId => this.getUserNameById(userId)).join(", ");
                this.addSystemMessage(`${this.currentUserName} removed ${removedNames}`);
            }
    
        } catch (error) {
            console.error("❌ Error updating group participants:", error);
        } finally {
            // ✅ Close popup and refresh UI
            this.showEditPopup = false;
            this.fetchGroupChats();
        }
    }
    
    getUserNameById(userId) {
        const user = this.users.find(user => user.userId === userId);
        return user ? user.name : "Unknown User";
    }
    
    
    
    
    // ✅ Add a system message when users are added/removed
    addSystemMessage(message) {
        firebase.firestore().collection("groupMessages").add({
            chatId: this.selectedGroupId,
            senderId: "SYSTEM",
            senderName: "System",
            text: message,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
    

    


    openEditModal(event) {
        this.editingMessageId = event.currentTarget.dataset.id;
        this.editedText = event.currentTarget.dataset.text; // ✅ Gets message text from dataset
        this.showEditModal = true;
        console.log("Editing message:", this.editedText);
    }

    /** ✅ Handle Input Change in Edit Modal */
    handleEditChange(event) {
        this.editedText = event.target.value;
    }    

    /** ✅ Save Edited Message */
    async saveEditedMessage() {
        if (!this.editingMessageId || !this.editedText.trim()) {
            return;
        }
    
        try {
            const messageRef = firebase.firestore().collection("messages").doc(this.editingMessageId);
            const messageDoc = await messageRef.get();
    
            if (!messageDoc.exists) {
                console.warn("⚠️ Message not found in Firestore!");
                return;
            }
    
            const messageData = messageDoc.data();
            const chatId = messageData.chatId;
    
            // ✅ Update the edited message
            await messageRef.update({
                text: this.editedText.trim(),
                isEdited: true
            });
    
            console.log("✅ Message updated successfully:", this.editingMessageId);
    
            // ✅ Fetch the latest message in the chat
            const lastMessageSnapshot = await firebase.firestore()
                .collection("messages")
                .where("chatId", "==", chatId)
                .orderBy("createdAt", "desc")
                .limit(1)
                .get();
    
            let newLastMessage = "";
            let newLastMessageAt = null;
    
            if (!lastMessageSnapshot.empty) {
                const lastMessageData = lastMessageSnapshot.docs[0].data();
                newLastMessage = lastMessageData.isDeleted ? "This message was deleted" : lastMessageData.text;
                newLastMessageAt = lastMessageData.createdAt;
            }
    
            // ✅ If the edited message was the latest one, update chat's last message
            if (messageDoc.id === lastMessageSnapshot.docs[0]?.id) {
                await firebase.firestore().collection("chats").doc(chatId).update({
                    lastMessage: newLastMessage,
                    lastMessageAt: newLastMessageAt
                });
    
                console.log("✅ Last message updated in chat:", newLastMessage);
            }
    
            // ✅ Update the UI instantly
            this.messages = this.messages.map(msg =>
                msg.id === this.editingMessageId ? { ...msg, text: this.editedText.trim(), isEdited: true } : msg
            );
    
            this.showEditModal = false; // ✅ Close modal
            this.editingMessageId = null; // ✅ Reset state
            this.fetchLastMessages();
        } catch (error) {
            console.error("❌ Error editing message:", error);
        }
    }
    

    /** ✅ Close Edit Modal */
    closeEditModal() {
        this.showEditModal = false;
        this.editingMessageId = null;
        this.editedText = "";
    }

// ✅ Open Delete Modal
openDeleteModal(event) {
    this.deletingMessageId = event.currentTarget.dataset.id;
    this.showDeleteModal = true;
}

// ✅ Close Delete Modal
closeDeleteModal() {
    this.showDeleteModal = false;
    this.deletingMessageId = null;
}

// ✅ Confirm Delete Message
async confirmDeleteMessage() {
    if (!this.deletingMessageId) return;

    try {
        const messageRef = firebase.firestore().collection("messages").doc(this.deletingMessageId);
        const messageDoc = await messageRef.get();

        if (!messageDoc.exists) {
            console.warn("⚠️ Message not found in Firestore!");
            return;
        }

        const messageData = messageDoc.data();
        const chatId = messageData.chatId;

        // ✅ Mark message as deleted
        await messageRef.update({
            text: "This message was deleted",
            isDeleted: true,
            isEdited: false // ✅ Remove edited flag
        });

        console.log("✅ Message marked as deleted:", this.deletingMessageId);

        // ✅ Fetch last message again to update chat
        const lastMessageSnapshot = await firebase.firestore()
            .collection("messages")
            .where("chatId", "==", chatId)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        let newLastMessage = "No messages yet";
        let newLastMessageAt = null;

        if (!lastMessageSnapshot.empty) {
            const lastMessageData = lastMessageSnapshot.docs[0].data();
            newLastMessage = lastMessageData.isDeleted ? "This message was deleted" : lastMessageData.text;
            newLastMessageAt = lastMessageData.createdAt;
        }

        // ✅ Update the last message in the chat
        await firebase.firestore().collection("chats").doc(chatId).update({
            lastMessage: newLastMessage,
            lastMessageAt: newLastMessageAt
        });

        console.log("✅ Updated Last Message in Chat:", newLastMessage);

        // ✅ Update UI immediately
        this.messages = this.messages.map(msg =>
            msg.id === this.deletingMessageId
                ? { 
                    ...msg, 
                    text: "This message was deleted", 
                    isDeleted: true, 
                    isEdited: false,  
                    className: "deleted-message"
                } 
                : msg
        );

        this.deletingMessageId = null;
        this.closeDeleteModal();
        this.listenToUserChats(); // ✅ Refresh chat list
        this.fetchLastMessages();

    } catch (error) {
        console.error("❌ Error marking message as deleted in Firestore:", error);
    }
}



    





openGroupEditModal(event) {
    this.editingGroupMessageId = event.currentTarget.dataset.id;
    this.editedGroupText = event.currentTarget.dataset.text; // ✅ Gets message text from dataset
    this.showGroupEditModal = true;
    console.log("Editing group message:", this.editedGroupText);
}


handleGroupEditChange(event) {
    this.editedGroupText = event.target.value;
}
async saveEditedGroupMessage() {
    if (!this.editingGroupMessageId || !this.editedGroupText.trim()) {
        return;
    }

    try {
        await firebase.firestore().collection("groupMessages").doc(this.editingGroupMessageId).update({
            text: this.editedGroupText.trim(),
            isEdited: true
        });

        console.log("✅ Group Message updated successfully:", this.editingGroupMessageId);

        // ✅ Update UI
        this.messages = this.messages.map(msg =>
            msg.id === this.editingGroupMessageId ? { ...msg, text: this.editedGroupText.trim(), isEdited: true } : msg
        );

        this.showGroupEditModal = false; // ✅ Close modal
        this.editingGroupMessageId = null; // ✅ Reset state
    } catch (error) {
        console.error("❌ Error editing group message:", error);
    }
}
closeGroupEditModal() {
    this.showGroupEditModal = false;
    this.editingGroupMessageId = null;
    this.editedGroupText = "";
}
openGroupDeleteModal(event) {
    this.deletingGroupMessageId = event.currentTarget.dataset.id;
    this.showGroupDeleteModal = true;
}
closeGroupDeleteModal() {
    this.showGroupDeleteModal = false;
    this.deletingGroupMessageId = null;
}
async confirmDeleteGroupMessage() {
    if (!this.deletingGroupMessageId) return;

    try {
        await firebase.firestore().collection("groupMessages").doc(this.deletingGroupMessageId).update({
            text: "This message was deleted",
            isDeleted: true
        });

        console.log("✅ Group message marked as deleted:", this.deletingGroupMessageId);

        // ✅ Update UI efficiently
        this.messages = this.messages.map(msg =>
            msg.id === this.deletingGroupMessageId
                ? { 
                    ...msg, 
                    text: "This message was deleted", 
                    isDeleted: true, 
                    className: "deleted-message"  // ✅ Apply deleted message class
                } 
                : msg
        );

        this.deletingGroupMessageId = null; // ✅ Reset ID after deletion
        this.closeGroupDeleteModal(); // ✅ Close modal after action
    } catch (error) {
        console.error("❌ Error marking group message as deleted:", error);
    }
}


@track showPollModal = false;
@track pollQuestion = "";
@track pollOptions = [{ id: Date.now() + 1, value: "" }, { id: Date.now() + 2, value: "" }];

addPollOption() {
    if (this.pollOptions.length >= 5) {
        alert("⚠️ Maximum 5 options allowed.");
        return;
    }
    this.pollOptions.push({ id: Date.now(), value: "" }); // Unique ID
}


// ✅ Open Poll Modal
openPollModal() {
    this.showPollModal = true;
}

// ✅ Close Poll Modal
closePollModal() {
    this.showPollModal = false;
    this.pollQuestion = "";
    this.pollOptions = [{ id: 1, value: "" }, { id: 2, value: "" }];
}

// ✅ Handle Poll Question Input
handlePollQuestionChange(event) {
    this.pollQuestion = event.target.value;
}

// ✅ Handle Poll Option Input
handlePollOptionChange(event) {
    const index = event.target.dataset.index;
    this.pollOptions[index].value = event.target.value;
}



// ✅ Remove Poll Option
removePollOption(event) {
    const index = event.target.dataset.index;
    this.pollOptions.splice(index, 1);
}

async sendPollMessage() {
    console.log("📌 [DEBUG] Sending Poll...");

    this.pollQuestion = this.pollQuestion.trim();
    console.log("📌 [DEBUG] Poll Question:", `"${this.pollQuestion}"`);

    if (!this.pollQuestion) {
        alert("⚠️ Please enter a question.");
        console.log("❌ [DEBUG] Poll question is empty!");
        return;
    }

    console.log("📌 [DEBUG] Original Poll Options:", JSON.stringify(this.pollOptions, null, 2));

    this.pollOptions = this.pollOptions.map(opt => ({
        id: opt.id,
        value: opt.value ? opt.value.trim() : ""
    }));

    console.log("📌 [DEBUG] Trimmed Poll Options:", JSON.stringify(this.pollOptions, null, 2));

    if (this.pollOptions.length < 2) {
        alert("⚠️ Please enter at least two options.");
        console.log("❌ [DEBUG] Less than 2 poll options provided!");
        return;
    }

    const emptyOptions = this.pollOptions.filter(opt => !opt.value);
    if (emptyOptions.length > 0) {
        alert("⚠️ Please fill in all poll options.");
        console.log(`❌ [DEBUG] Empty poll options detected:`, JSON.stringify(emptyOptions, null, 2));
        return;
    }

    try {
        console.log("📌 [DEBUG] Poll validation passed! Preparing to send...");

        const timestamp = firebase.firestore.FieldValue.serverTimestamp();

        // ✅ Determine poll alignment (Right for sender, Left for receiver)

        let isSender = this.currentUserId === this.groupAdminId;  // 🔹 Check if sender is group admin
        let senderClass = isSender ? "message-sent-poll" : "message-received-poll";

        const pollData = {
            chatId: this.selectedGroupId,
            senderId: this.currentUserId,
            senderName: this.currentUserName,
            isPoll: true,
            pollQuestion: this.pollQuestion,
            pollOptions: this.pollOptions.map(opt => ({ value: opt.value, votes: 0, voters: [] })),
            createdAt: timestamp,
            senderClass: senderClass
        };

        console.log("📌 [DEBUG] Poll Data to Firestore:", JSON.stringify(pollData, null, 2));
        await firebase.firestore().collection("groupMessages").add(pollData);

        console.log("✅ [DEBUG] Poll successfully sent to Firestore!");
        this.closePollModal();
    } catch (error) {
        console.error("❌ [DEBUG] Error sending poll:", error);
    }
}



handlePollOptionChange(event) {
    const optionId = event.target.dataset.id;
    const newValue = event.target.value.trim();

    // ✅ Update the corresponding option value
    this.pollOptions = this.pollOptions.map(opt => 
        opt.id == optionId ? { ...opt, value: newValue } : opt
    );

    console.log("📌 [DEBUG] Updated Poll Options:", JSON.stringify(this.pollOptions, null, 2));
}

openGroupDeleteModal(event) {
    this.deletingGroupMessageId = event.currentTarget.dataset.id;
    this.showGroupDeleteModal = true;
}

async confirmDeleteGroupMessage() {
    if (!this.deletingGroupMessageId) return;

    try {
        const pollRef = firebase.firestore().collection("groupMessages").doc(this.deletingGroupMessageId);
        const pollDoc = await pollRef.get();

        if (!pollDoc.exists) {
            console.warn("⚠️ Poll message not found in Firestore!");
            return;
        }

        const pollData = pollDoc.data();
        if (pollData.isPoll) {
            // ✅ If it's a poll, mark as deleted in Firestore
            await pollRef.update({
                text: "This message was deleted",
                isDeleted: true,
                isPollDeleted: true, // 🔹 Mark poll as deleted
                pollQuestion: "This message was deleted",
                pollOptions: [] // 🔹 Remove all poll options
            });

            console.log("✅ Poll successfully marked as deleted in Firestore:", this.deletingGroupMessageId);
        } else {
            // ✅ If it's a normal message, mark as deleted
            await pollRef.update({
                text: "This message was deleted",
                isDeleted: true
            });

            console.log("✅ Group message marked as deleted in Firestore:", this.deletingGroupMessageId);
        }

        // ✅ Update UI efficiently
        this.messages = this.messages.map(msg =>
            msg.id === this.deletingGroupMessageId
                ? { 
                    ...msg, 
                    text: "This message was deleted", 
                    isDeleted: true, 
                    isPollDeleted: pollData.isPoll, // ✅ Track poll deletion
                    pollOptions: [], // ✅ Clear poll options from UI
                    className: "deleted-message"
                } 
                : msg
        );

        this.deletingGroupMessageId = null; // ✅ Reset ID after deletion
        this.closeGroupDeleteModal(); // ✅ Close modal after action
    } catch (error) {
        console.error("❌ Error marking group message as deleted in Firestore:", error);
    }
}

@track activeTab = "chats"; // Default tab

// Getters to determine active tab
get isChatTabActive() {
    return this.activeTab === "chats";
}

get isGroupTabActive() {
    return this.activeTab === "groups";
}

// Button class for styling active tab
get getChatTabClass() {
    return this.activeTab === "chats" ? "tab-button active" : "tab-button";
}

get getGroupTabClass() {
    return this.activeTab === "groups" ? "tab-button active" : "tab-button";
}

// Switch tab to "Chats"
switchToChats() {
    this.activeTab = "chats";
}

// Switch tab to "Groups"
switchToGroups() {
    this.activeTab = "groups";
}


// ✅ PLACE IT INSIDE YOUR CLASS (NOT OUTSIDE)
async deleteUATUsersAndRelatedData() {
    try {
        console.log("🔥 Deleting users, group chats, messages, and chats for env='R&D'...");

        const usersSnapshot = await firebase.firestore()
            .collection("users")
            .where("env", "==", "R&D")
            .get();

        if (usersSnapshot.empty) {
            console.warn("⚠️ No users found with env='R&D'.");
            return;
        }

        let userIdsToDelete = [];
        let batch = firebase.firestore().batch();
        
        usersSnapshot.forEach((doc, index) => {
            const userId = doc.data().userId;
            userIdsToDelete.push(userId);
            batch.delete(doc.ref);

            // ✅ Commit every 500 deletes (to avoid Firestore limits)
            if ((index + 1) % 500 === 0) {
                batch.commit();
                batch = firebase.firestore().batch();  // Reset batch
            }
        });

        // ✅ Commit remaining batch if any users are left
        if (userIdsToDelete.length % 500 !== 0) {
            await batch.commit();
        }

        console.log(`✅ Deleted ${userIdsToDelete.length} users.`);

        // 🔥 **Delete Related Group Chats** where env = "R&D"
        const groupChatsSnapshot = await firebase.firestore()
            .collection("groupChats")
            .where("env", "==", "R&D")
            .get();

        batch = firebase.firestore().batch();
        groupChatsSnapshot.forEach((doc, index) => {
            batch.delete(doc.ref);
            if ((index + 1) % 500 === 0) {
                batch.commit();
                batch = firebase.firestore().batch();
            }
        });

        if (groupChatsSnapshot.size % 500 !== 0) {
            await batch.commit();
        }

        console.log(`✅ Deleted ${groupChatsSnapshot.size} group chats.`);

        // 🔥 **Delete Related Chats** where user is a participant (in chunks of 30)
        let chunkSize = 30;
        for (let i = 0; i < userIdsToDelete.length; i += chunkSize) {
            let chunk = userIdsToDelete.slice(i, i + chunkSize);

            const chatsSnapshot = await firebase.firestore()
                .collection("chats")
                .where("participants", "array-contains-any", chunk)
                .get();

            let chatBatch = firebase.firestore().batch();
            chatsSnapshot.forEach(doc => chatBatch.delete(doc.ref));

            await chatBatch.commit();
            console.log(`✅ Deleted ${chatsSnapshot.size} chats for ${chunk.length} users.`);
        }

        // 🔥 **Delete Related Group Messages** where `senderId` is in the deleted users
        for (let i = 0; i < userIdsToDelete.length; i += chunkSize) {
            let chunk = userIdsToDelete.slice(i, i + chunkSize);

            const groupMessagesSnapshot = await firebase.firestore()
                .collection("groupMessages")
                .where("senderId", "in", chunk)
                .get();

            let messageBatch = firebase.firestore().batch();
            groupMessagesSnapshot.forEach(doc => messageBatch.delete(doc.ref));

            await messageBatch.commit();
            console.log(`✅ Deleted ${groupMessagesSnapshot.size} group messages for ${chunk.length} users.`);
        }

        console.log("🔥 Successfully deleted all related data for env='R&D'!");

    } catch (error) {
        console.error("❌ Error deleting users, chats, and messages:", error);
    }
}




}