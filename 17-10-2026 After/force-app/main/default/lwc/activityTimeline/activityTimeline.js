import { LightningElement, api } from 'lwc';

export default class ActivityTimeline extends LightningElement {
    @api activities = [];

    get timelineItems() {
        // Return static mockup logs as required by this phase
        // return [
        //     {
        //         index: 1,
        //         Activity_Type__c: 'Assigned to Kim John',
        //         Activity_DateTime__c: '29 May 2029 12:10 PM',
        //         userName: 'System Admin',
        //         badgeClass: 'timeline-badge badge-primary'
        //     },
        //     {
        //         index: 2,
        //         Activity_Type__c: 'Incident Created (INC-2029-007)',
        //         Activity_DateTime__c: '29 May 2029 10:10 AM',
        //         userName: 'Emily Nun',
        //         badgeClass: 'timeline-badge badge-secondary'
        //     },
        //     {
        //         index: 3,
        //         Activity_Type__c: 'Attachments Added (Photo1764H.JPEG)',
        //         Activity_DateTime__c: '29 May 2029 10:10 AM',
        //         userName: 'Emily Nun',
        //         badgeClass: 'timeline-badge badge-secondary'
        //     },
        //     {
        //         index: 4,
        //         Activity_Type__c: 'Incident Reported',
        //         Activity_DateTime__c: '29 May 2029 9:10 AM',
        //         userName: 'Emily Nun',
        //         badgeClass: 'timeline-badge badge-secondary'
        //     }
        // ];
        const list = Array.isArray(this.activities) ? this.activities : [];
        const deduped = [];
        for (const entry of list) {
            const last = deduped[deduped.length - 1];
            const isDuplicate =
                last &&
                last.action === entry.action &&
                last.content === entry.content &&
                last.timestamp === entry.timestamp;
            if (!isDuplicate) {
                deduped.push(entry);
            }
        }
        const reversed = [...deduped].reverse();
        const totalCount = reversed.length;

        return reversed.map((entry, idx) => {
            const label = entry.content
                ? `${entry.action}: ${entry.content}`
                : entry.action || '';

            return {
                //index: idx + 1,
                index: totalCount - idx,
                Activity_Type__c: label,
                Activity_DateTime__c: entry.timestamp || '',
                userName: entry.user || 'Unknown',
                badgeClass:
                    idx === 0
                        ? 'timeline-badge badge-primary'
                        : 'timeline-badge badge-secondary'
            };
        });
        
    }
}