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
import firebaseLib from "@salesforce/resourceUrl/firebaseLib";

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
    deferUserInit = false;


    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

//     connectedCallback() {
//     console.log('📌 Received Org Name in Chatter:', this.orgfullname);
//     console.log('📌 Received Org ID in Chatter:', this.orgid);

//     if (!this.firebaseInitialized) {
//         Promise.all([
//             loadScript(this, "https://www.gstatic.com/firebasejs/11.8.0/firebase-app-compat.js"),
//             loadScript(this, "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore-compat.js")
//         ])
//         .then(() => {
//             this.initializeFirebase();
//             this.firebaseInitialized = true;

//             // ✅ Now safe to initialize users if they were fetched earlier
//             if (this.deferUserInit) {
//                 console.log("🚀 Running deferred Firebase user initialization...");
//                 this.initializeUsersInFirebase();
//                 this.deferUserInit = false;
//             }

//             if (!this.users.length) {
//                 this.initializeUsersInFirebase(); // Also run if users not already fetched
//             }

//             this.listenToUserChats();
//         })
//         .catch((error) => {
//             console.error("❌ Error loading Firebase:", error);
//         });
//     }

//     console.log("currentuser: " + this.currentUserId);
//     console.log("orgname: " + this.orgid);

//     this.filteredExistingChats = [...this.existingChats];
//     this.filteredNewChats = [...this.newChats.filter(user => user.id !== this.currentUserId)];

//     console.log('📌 CHECK THIS OUT:', JSON.stringify(this.filteredExistingChats));

//     if (this.wiredFirestoreUsersData) {
//         refreshApex(this.wiredFirestoreUsersData);
//         console.log("🔄 Wire data refreshed!");
//     }
// }

connectedCallback() {
    console.log('📌 Received Org Name in Chatter:', this.orgfullname);
    console.log('📌 Received Org ID in Chatter:', this.orgid);

    if (!this.firebaseInitialized) {
        Promise.all([
            loadScript(this, firebaseLib + '/firebase-app-compat.js'),
            loadScript(this, firebaseLib + '/firebase-firestore-compat.js')
        ])
        .then(() => {
            this.initializeFirebase();
            this.firebaseInitialized = true;

            if (this.deferUserInit) {
                console.log("🚀 Running deferred Firebase user initialization...");
                this.initializeUsersInFirebase();
                this.deferUserInit = false;
            }

            if (!this.users.length) {
                this.initializeUsersInFirebase(); // Also run if users not already fetched
            }

            this.listenToUserChats();
        })
        .catch((error) => {
            console.error("❌ Error loading Firebase SDKs from static resource:", error);
        });
    }

    console.log("currentuser: " + this.currentUserId);
    console.log("orgname: " + this.orgid);

    this.filteredExistingChats = [...this.existingChats];
    this.filteredNewChats = [...this.newChats.filter(user => user.id !== this.currentUserId)];

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
                    const lastMessage = chatData.lastMessage || "No messages yet";
                    const lastMessageAt = chatData.lastMessageAt ? new Date(chatData.lastMessageAt.toDate()) : null;
                    const formattedTime = lastMessageAt ? this.formatLastMessageTime(lastMessageAt) : "";
    
                    // ✅ Find the user that the chat is with
                    const otherUserId = chatData.participants.find(id => id !== this.currentUserId);
                    const userIndex = updatedUsers.findIndex(user => user.id === otherUserId);
    
                    if (userIndex !== -1) {
                        updatedUsers[userIndex] = {
                            ...updatedUsers[userIndex],
                            lastMessage,
                            lastMessageAt,
                            lastMessageTime: formattedTime
                        };
                    }
                });
    
                // ✅ Sort users based on latest message timestamp
                updatedUsers.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    
                // ✅ Update filtered users, ensuring current user is not included
                this.filteredUsers = updatedUsers.filter(user => user.id !== this.currentUserId);
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
            const parsedData = JSON.parse(data);
            if (parsedData.documents && Array.isArray(parsedData.documents)) {
                // ✅ Fetch only users whose `orgId` matches `this.orgid`
                this.users = parsedData.documents
                    .map(doc => ({
                        env: doc.fields?.env?.stringValue || "Unknown env",
                        id: doc.fields?.id?.stringValue?.trim() || "",
                        orgId: doc.fields?.orgId?.stringValue || "Unknown org",
                        name: doc.fields?.name?.stringValue || "Unknown User",
                        avatar: doc.fields?.avatar?.stringValue || "",
                        lastMessage: "",
                        lastMessageAt: null
                    }))
                    .filter(user => user.orgId === this.orgid); // ✅ Filter users by `orgid`

                console.log("✅ Filtered Users Matching Org ID:", JSON.stringify(this.users, null, 2));

                // ✅ Call fetchCurrentUser after Firestore data is set
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
            const parsedData = JSON.parse(data);
            console.log("✅ Users Fetched from Apex:", parsedData);

            if (typeof parsedData === 'object' && parsedData !== null) {
                this.orgusers = Object.values(parsedData).flatMap(org => 
                    org.usersList.map(user => ({
                        id: user.userId,
                        name: `${user.firstname} ${user.lastname}`,
                        email: user.email,
                        avatar: user.photoUrl || '',
                        orgId: org.organisationName,
                        env: org.env,
                        lastMessage: "",
                        lastMessageAt: null
                    }))
                );
            }

            console.log("✅ Formatted Org Users:", JSON.stringify(this.orgusers, null, 2));

            // ✅ Only initialize users if Firebase is ready
            if (this.firebaseInitialized) {
                this.initializeUsersInFirebase();
            } else {
                console.warn("⏳ Firebase not ready yet — deferring user initialization.");
                this.deferUserInit = true; // Flag to retry later
            }

        } catch (error) {
            console.error("❌ Error parsing JSON from Apex:", error);
        }
    } else if (error) {
        console.error("❌ Error fetching org users from Apex:", error);
    }
}


   async initializeUsersInFirebase() {
    // ✅ Ensure Firebase is loaded before proceeding
    if (typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length) {
        console.warn("⚠️ Firebase is not initialized. Skipping user initialization.");
        return;
    }

    if (!this.orgusers.length) {
        console.warn("⚠️ No users to initialize in Firebase.");
        return;
    }

    try {
        const batch = firebase.firestore().batch();
        const usersRef = firebase.firestore().collection("users");

        this.orgusers.forEach(user => {
            const userId = user.id.trim();
            const userDocRef = usersRef.doc(user.id);
            batch.set(userDocRef, {
                id: userId,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                orgId: user.orgId,
                env: user.env,
                lastMessage: "",
                lastMessageAt: null
            }, { merge: true });
        });

        await batch.commit();
        console.log("🔥 Org Users successfully initialized in Firebase Firestore!");
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
        const currentUser = this.orgusers.find(user => user.id === this.currentUserId);
    
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
        this.filterUsers();
    }
    
    
    
    

    filterUsers() {
        if (!this.users.length) {
            console.warn("⚠️ No users available to filter.");
            return;
        }
    
        console.log("📌 Filtering out Current User ID:", `"${this.currentUserId.trim()}"`);
    
        // ✅ Filter out the current user
        this.filteredUsers = this.users.filter(user => user.id.trim() !== this.currentUserId.trim());
    
        console.log("✅ Filtered Users (Excluding Current User):", this.filteredUsers.map(user => user.name));
    
        // ✅ Force UI update to reflect changes
        this.filteredUsers = [...this.filteredUsers];
    
        // Fetch last messages after filtering
        this.fetchLastMessages();
    }
    
    
    

    async fetchLastMessages() {
        console.log("🔄 Fetching last messages for each user...");
    
        let usersWithMessages = [];
        let usersWithoutMessages = [];
    
        try {
            const chatSnapshots = await firebase.firestore()
                .collection('chats')
                .where('participants', 'array-contains', this.currentUserId)
                .get();
    
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
                if (user.id === this.currentUserId) {
                    return; // ✅ Skip the current user
                }
    
                if (chatMap.has(user.id)) {
                    // ✅ Existing chat found, add user to existing chats
                    let chatInfo = chatMap.get(user.id);
    
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
            this.newChats = usersWithoutMessages.filter(user => user.id !== this.currentUserId); // ✅ Remove current user
    
            // ✅ Ensure `filteredExistingChats` only contains users with messages
            this.filteredExistingChats = [...usersWithMessages];
    
            // ✅ Ensure `filteredNewChats` contains users without messages
            this.filteredNewChats = [...usersWithoutMessages];
    
            console.log("✅ Existing Chats (with messages):", this.filteredExistingChats.map(user => user.name));
            console.log("✅ New Chats (without messages):", this.filteredNewChats.map(user => user.name));
           //this.isLoading=false;
    
        } catch (error) {
            console.error("❌ Error fetching last messages:", error);
        }
    }
    
    
    

    sortAndUpdateFilteredUsers(usersWithMessages, usersWithoutMessages) {
        // ✅ Sort users with messages by lastMessageAt (most recent first)
        usersWithMessages.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    
        // ✅ Merge both lists
        this.filteredUsers = [...usersWithMessages, ...usersWithoutMessages]
            .filter(user => user.id.trim() !== this.currentUserId.trim());
    
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
    console.log("Event Current Target:", event.currentTarget);  // Check if this logs the expected element
    console.log("Dataset:", event.currentTarget.dataset);  // This should include the id
    

    const userId = event.currentTarget.dataset.id;
    console.log("Clicked User ID:", userId);

    if (!userId || userId.trim() === "") {
        console.warn("No user ID found in dataset. Check if `data-id` is set properly.");
        return;
    }

    this.selectedUserId = userId;
    console.log("✅ Selected User ID Set:", this.selectedUserId);

    const user = this.newChats.find(u => u.id === userId);

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
        this.newChats = this.newChats.filter(user => user.id !== this.selectedUserId);
        this.existingChats = [...this.existingChats, user];

        // ✅ Switch back to chat list after selecting
        this.showNewUserPopup = false;
    } catch (error) {
        console.error("❌ Error selecting new user:", error);
    }
}

async selectUser(event) {
    event.stopPropagation(); // Ensure event doesn't bubble up

    const userId = event.currentTarget.dataset.id;
    console.log("🟢 Clicked User ID:", userId);
    if (!userId) {
        console.warn("⚠️ No user ID found in dataset.");
        return;
    }

    this.selectedUserId = userId;
    const user = this.existingChats.find(u => u.id === userId);

    if (user) {
        this.selectedUserName = user.name;
        this.selectedUserAvatar = user.avatar || "";
        console.log("💬 Chatting with:", this.selectedUserName);
    }

    try {
        const chatId = await this.createOrGetChat(this.currentUserId, userId);
        this.chatId = chatId;
        this.messages = [];
        this.listenToMessages(chatId);
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
    
    // ✅ Handle "Enter" Key Press
    handleKeyPress(event) {
        if (event.key === "Enter") {
            this.sendMessage();
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
                    let newMessagesCount = 0;
                    let shouldAutoScroll = this.isUserAtBottom(); // Check if user is at the bottom

                    snapshot.docs.forEach(doc => {
                        const data = doc.data();
                        const messageDate = data.createdAt ? new Date(data.createdAt.toDate()) : new Date();
                        let formattedDate = messageDate.toLocaleDateString('en-GB');

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

                        groupedMessages.push({
                            id: doc.id,
                            text: data.text,
                            senderClass: data.senderId === this.currentUserId ? "message-sent" : "message-received",
                            timestampClass: data.senderId === this.currentUserId ? "timestamp timestamp-right" : "timestamp timestamp-left",
                            createdAt: messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        });
                    });

                    this.messages = groupedMessages;
                    this.listenToUserChats();

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
            const messagesContainer = this.template.querySelector(".messages-container");
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                this.unreadMessagesCount = 0; // Reset unread message count
            }
        }, 200);
    }

    // ✅ Check if user is at the bottom of the chat
    isUserAtBottom() {
        const messagesContainer = this.template.querySelector(".messages-container");
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
        const currentUser = this.users.find(user => user.id === this.currentUserId);
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
}