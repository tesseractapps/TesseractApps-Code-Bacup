({
    initialize: function(component, event, helper) {
        $A.get("e.siteforce:registerQueryEventMap").setParams({"qsToEvent" : helper.qsToEventMap}).fire();    
        $A.get("e.siteforce:registerQueryEventMap").setParams({"qsToEvent" : helper.qsToEventMap2}).fire();
        
        // Call helper functions to hide external elements
        helper.hideCenterPanel(); 
        helper.hideHeaderPadding();
        
        // Start the typewriter animation
        helper.typeWriter(component); 
        
        // Load remembered username on initialization
        helper.getRememberedUsername(component);
        
        component.set('v.isUsernamePasswordEnabled', helper.getIsUsernamePasswordEnabled(component, event, helper));
        component.set("v.isSelfRegistrationEnabled", helper.getIsSelfRegistrationEnabled(component, event, helper));
        component.set("v.communityForgotPasswordUrl", helper.getCommunityForgotPasswordUrl(component, event, helper));
        component.set("v.communitySelfRegisterUrl", helper.getCommunitySelfRegisterUrl(component, event, helper));
    },
    
    // --- View Toggle Functions ---
    toggleViewToForgot: function(component, event, helper) {
        component.set("v.isLoginView", false);
        // Clear old messages when switching views
        component.set("v.showError", false);
        component.set("v.errorMessage", '');
        component.set("v.forgotMessage", '');
    },
    
    toggleViewToLogin: function(component, event, helper) {
        component.set("v.isLoginView", true);
        // Clear old messages when switching views
        component.set("v.showError", false);
        component.set("v.errorMessage", '');
        component.set("v.forgotMessage", '');
    },
    
    // --- Login/Reset Submission Functions ---
    handleLogin: function (component, event, helpler) {
        // Clear reset message before login attempt
        component.set("v.forgotMessage", ''); 
        helpler.handleLogin(component, event, helpler); 
    },
    
    handleForgotPassword: function (component, event, helper) {
        // Handle in-page forgot password submission
        helper.handleForgotPassword(component, event, helper); 
    },
    
    // --- Existing Functions ---
    setStartUrl: function (component, event, helpler) {
        var startUrl = event.getParam('startURL');
        if(startUrl) {
            component.set("v.startUrl", startUrl);
        }
    },
    
    setExpId: function (component, event, helper) {
        var expId = event.getParam('expid');
        if (expId) {
            component.set("v.expid", expId);
        }
        helper.setBrandingCookie(component, event, helper);
    },
    
    onKeyUp: function(component, event, helpler){
        //checks for "enter" key
        if (event.getParam('keyCode')===13) {
            if (component.get("v.isLoginView")) {
                helpler.handleLogin(component, event, helpler);
            }
        }
    },
    
    onRememberMeChange: function(component, event, helper) {
        let isChecked = component.get("v.isRememberMe");
        let username = component.get("v.usernameValue");
        
        if (isChecked && username) {
            helper.saveUsername(username);
        } else {
            helper.removeUsername();
        }
    },

    togglePassword: function(component) {
        let current = component.get("v.isPasswordVisible");
        component.set("v.isPasswordVisible", !current);
    },
    
    navigateToSelfRegister: function(cmp, event, helper) {
        var selfRegUrl = cmp.get("v.communitySelfRegisterUrl");
        if (selfRegUrl == null) {
            selfRegUrl = cmp.get("v.selfRegisterUrl");
        }
        var startUrl = cmp.get("v.startUrl");
        if(startUrl){
            if(selfRegUrl.indexOf("?") === -1) {
                selfRegUrl = selfRegUrl + '?startURL=' + decodeURIComponent(startUrl);
            } else {
                selfRegUrl = selfRegUrl + '&startURL=' + decodeURIComponent(startUrl);
            }
        }
        var attributes = { url: selfRegUrl };
        $A.get("e.force:navigateToURL").setParams(attributes).fire();
    }
    
    // The functions 'onFocus', 'onBlur', and 'afterRender' have been removed
})