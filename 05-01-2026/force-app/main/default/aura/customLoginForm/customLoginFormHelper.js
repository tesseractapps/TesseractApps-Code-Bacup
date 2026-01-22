({
    
    // --- TYPEWRITER STATE AND LOGIC ---
    
    words: ['Payroll', 'Human Resource', 'Accounting', 'Workforce'],
    typingSpeed: 100,
    pauseTime: 1000, 
    isDeleting: false,
    currentIndex: 0,
    currentText: 'Payroll', 

    typeWriter: function(component) {
        let fullText = this.words[this.currentIndex];
        let currentTextValue = component.get('v.highlightText');
        let currentLength = currentTextValue.length;

        if (!this.isDeleting && currentLength < fullText.length) {
            currentTextValue = fullText.substring(0, currentLength + 1);
            component.set('v.highlightText', currentTextValue);
            
            setTimeout($A.getCallback(() => this.typeWriter(component)), this.typingSpeed);
            
        } else if (this.isDeleting && currentLength > 0) {
            currentTextValue = fullText.substring(0, currentLength - 1);
            component.set('v.highlightText', currentTextValue);

            setTimeout($A.getCallback(() => this.typeWriter(component)), this.typingSpeed / 2);
            
        } else {
            if (!this.isDeleting) {
                this.isDeleting = true;
                setTimeout($A.getCallback(() => this.typeWriter(component)), this.pauseTime);
            } else {
                this.isDeleting = false;
                this.currentIndex = (this.currentIndex + 1) % this.words.length;
                
                // Ensure the component's text reflects the starting state of the new word
                let nextWord = this.words[this.currentIndex];
                component.set('v.highlightText', nextWord.substring(0, 1)); 

                setTimeout($A.getCallback(() => this.typeWriter(component)), this.typingSpeed);
            }
        }
    },
    
    // --- LOGIN/RESET SUBMISSION LOGIC ---
    
    handleLogin: function (component, event, helpler) {
        // Reads username and password from data-bound attributes
        var username = component.get("v.usernameValue");
        var password = component.get("v.password"); 
        
        // --- START CLIENT-SIDE VALIDATION ---
        
        // Clear previous error messages
        component.set("v.errorMessage", null);
        component.set("v.showError", false);
        
        if ($A.util.isEmpty(username)) {
            component.set("v.errorMessage", "Username field cannot be left blank.");
            component.set("v.showError", true);
            return;
        }

        if ($A.util.isEmpty(password)) {
            component.set("v.errorMessage", "Password field cannot be left blank.");
            component.set("v.showError", true);
            return; // Stop login attempt
        }
        
        // --- END CLIENT-SIDE VALIDATION ---
        
        var action = component.get("c.login");
        var startUrl = component.get("v.startUrl");
        
        // Handle Remember Me logic
        let isRememberMe = component.get("v.isRememberMe");
        if (isRememberMe) {
            helpler.saveUsername(username);
        } else {
            helpler.removeUsername();
        }
        
        startUrl = decodeURIComponent(startUrl);
        
        action.setParams({username:username, password:password, startUrl:startUrl});
        action.setCallback(this, function(a){
            var rtnValue = a.getReturnValue();
            if (rtnValue !== null) {
                component.set("v.errorMessage",rtnValue);
                component.set("v.showError",true);
            }
        });
        $A.enqueueAction(action);
    },
    
    handleForgotPassword: function (component, event, helper) {
        var username = component.get("v.usernameValue");
        
        // --- START CLIENT-SIDE VALIDATION ---
        if ($A.util.isEmpty(username)) {
            // Display custom error message if username is empty
            component.set("v.errorMessage", "Username field cannot be left blank.");
            component.set("v.showError", true);
            return; // Stop the process immediately
        }
        // --- END CLIENT-SIDE VALIDATION ---

        // Clear previous messages and errors
        component.set("v.showError", false);
        component.set("v.errorMessage", '');
        component.set("v.forgotMessage", '');

        var forgotUrl = component.get("v.communityForgotPasswordUrl");
        
        // Fallback to default if community URL is not set
        if ($A.util.isEmpty(forgotUrl)) {
            forgotUrl = component.get("v.forgotPasswordUrl");
        }

        if ($A.util.isEmpty(forgotUrl)) {
            component.set("v.errorMessage", "Forgot password URL is not available.");
            component.set("v.showError", true);
            return;
        }

        // Pass the username in the URL for the next page to pre-fill it
        if (username) {
            // Use 'un' as parameter name, or use 'username' if your page expects it
            forgotUrl = forgotUrl + "?un=" + encodeURIComponent(username);
        }

        // Use Aura event to redirect to the Forgot Password page
        $A.get("e.force:navigateToURL")
            .setParams({ url: forgotUrl })
            .fire();
    },
    // --- UI/FRAMEWORK UTILITIES ---
    

    
    qsToEventMap: {
        'startURL'  : 'e.c:setStartUrl'
    },

    qsToEventMap2: {
        'expid'  : 'e.c:setExpId'
    },
    
    hideCenterPanel: function() {
        setTimeout(function() {
            const centerPanel = document.querySelector("#centerPanel");
            if (centerPanel) {
                centerPanel.style.cssText = 'display: none; visibility: hidden; height: 0; padding: 0; margin: 0;';
            }
        }, 50); 
    },
    
    hideHeaderPadding: function() {
        setTimeout(function() {
            const headerDiv = document.querySelector("#header > div > div");
            if (headerDiv) {
                headerDiv.style.cssText = 'padding: 0px !important;'; 
            }
        }, 50); 
    },
    
    // --- REMEMBER ME LOCAL STORAGE FUNCTIONS ---
    
    saveUsername: function (username) {
        if (typeof window.localStorage !== 'undefined') {
            localStorage.setItem('rememberedEmail', username);
        }
    },

    removeUsername: function () {
        if (typeof window.localStorage !== 'undefined') {
            localStorage.removeItem('rememberedEmail');
        }
    },

    getRememberedUsername: function (component) {
        if (typeof window.localStorage !== 'undefined') {
            let username = localStorage.getItem('rememberedEmail');
            if (username) {
                component.set("v.usernameValue", username);
                component.set("v.isRememberMe", true);
            }
        }
    },
    
    // --- Existing Get/Set Methods ---
    getIsUsernamePasswordEnabled : function (component, event, helpler) {
        var action = component.get("c.getIsUsernamePasswordEnabled");
        action.setCallback(this, function(a){
        var rtnValue = a.getReturnValue();
            if (rtnValue !== null) {
                component.set('v.isUsernamePasswordEnabled',rtnValue);
            }
        });
        $A.enqueueAction(action);
    },
    
    getIsSelfRegistrationEnabled : function (component, event, helpler) {
        var action = component.get("c.getIsSelfRegistrationEnabled");
        action.setCallback(this, function(a){
        var rtnValue = a.getReturnValue();
            if (rtnValue !== null) {
                component.set('v.isSelfRegistrationEnabled',rtnValue);
            }
        });
        $A.enqueueAction(action);
    },
    
    getCommunityForgotPasswordUrl : function (component, event, helpler) {
        var action = component.get("c.getForgotPasswordUrl");
        action.setCallback(this, function(a){
        var rtnValue = a.getReturnValue();
            if (rtnValue !== null) {
                component.set('v.communityForgotPasswordUrl',rtnValue);
            }
        });
        $A.enqueueAction(action);
    },
    
    getCommunitySelfRegisterUrl : function (component, event, helpler) {
        var action = component.get("c.getSelfRegistrationUrl");
        action.setCallback(this, function(a){
        var rtnValue = a.getReturnValue();
            if (rtnValue !== null) {
                component.set('v.communitySelfRegisterUrl',rtnValue);
            }
        });
        $A.enqueueAction(action);
    },

    

    setBrandingCookie: function (component, event, helpler) {
        var expId = component.get("v.expid");
        if (expId) {
            var action = component.get("c.setExperienceId");
            action.setParams({expId:expId});
            action.setCallback(this, function(a){ });
            $A.enqueueAction(action);
        }
    }
    // The functions 'handleAutoFill' and 'applyFloatingLabelState' have been removed
})