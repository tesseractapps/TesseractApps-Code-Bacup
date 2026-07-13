public with sharing class DashboardLayoutController {

    @AuraEnabled(cacheable=false)
    public static String getLayout(Id staffId) {
        try {
            Staff__c staff = [
                SELECT Id, Dashboard_Layout__c 
                FROM Staff__c 
                WHERE Id = :staffId 
                LIMIT 1
            ];
            return staff.Dashboard_Layout__c;
        } catch (Exception e) {
            System.debug('Error fetching layout: ' + e.getMessage());
            return null;
        }
    }

    @AuraEnabled
    public static void saveLayout(Id staffId, String layoutJson) {
        System.debug('--- DashboardLayoutController.saveLayout called ---');
        System.debug('Received staffId: ' + staffId);
        System.debug('Received layoutJson length: ' + (layoutJson != null ? layoutJson.length() : 0));

        try {
            Staff__c staff = [
                SELECT Id, Dashboard_Layout__c
                FROM Staff__c 
                WHERE Id = :staffId 
                LIMIT 1
            ];
            System.debug('Found Staff__c record: ' + staff.Id);

            staff.Dashboard_Layout__c = layoutJson;
            update staff;

            System.debug('Successfully updated Dashboard_Layout__c for staff: ' + staff.Id);
        } catch (Exception e) {
            System.debug('Exception during saveLayout: ' + e.getMessage());
            throw new AuraHandledException('Error saving layout: ' + e.getMessage());
        }
    }


    @AuraEnabled
    public static void deleteWidgetFromLayout(Id staffId, String widgetId) {
        try {
            String layoutJson = getLayout(staffId);
            if (layoutJson != null) {
                List<Object> widgets = (List<Object>) JSON.deserializeUntyped(layoutJson);
                List<Object> updatedWidgets = new List<Object>();

                for (Object widget : widgets) {
                    Map<String, Object> widgetMap = (Map<String, Object>) widget;
                    if (widgetMap.get('id') != widgetId) {
                        updatedWidgets.add(widget);
                    }
                }

                saveLayout(staffId, JSON.serialize(updatedWidgets));
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error deleting widget: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void addWidgetToLayout(Id staffId, String widgetId, String widgetType, String style) {
        try {
            String layoutJson = getLayout(staffId);
            List<Object> widgets = new List<Object>();

            if (layoutJson != null) {
                widgets = (List<Object>) JSON.deserializeUntyped(layoutJson);
            }

            Boolean widgetExists = false;
            for (Object widget : widgets) {
                Map<String, Object> widgetMap = (Map<String, Object>) widget;
                if (widgetMap.get('id') == widgetId) {
                    widgetExists = true;
                    break;
                }
            }

            if (!widgetExists) {
                Map<String, Object> newWidget = new Map<String, Object>();
                newWidget.put('id', widgetId);
                newWidget.put('type', widgetType);
                newWidget.put('style', style);
                newWidget.put('visible', true);
                widgets.add(newWidget);

                saveLayout(staffId, JSON.serialize(widgets));
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error adding widget: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Facility__c> getAllFacilities() {
        Id currentUserId = UserInfo.getUserId();
        system.debug('currentUserId >>'+ currentUserId);
        // Fetch the current user and their organization
        User us = [
            SELECT Id, Organization_Name__c 
            FROM User 
            WHERE Id = :currentUserId
            LIMIT 1
        ];

        system.debug('us >>'+ us);

        // If Organization is set, fetch related Facilities
        if (us.Organization_Name__c != null) {
            return [
                SELECT Id, Name, Organisation__c, Organisation__r.Name 
                FROM Facility__c 
                WHERE Organisation__r.Name = :us.Organization_Name__c
            ];
        } else {
            return new List<Facility__c>();
        }
    }

}