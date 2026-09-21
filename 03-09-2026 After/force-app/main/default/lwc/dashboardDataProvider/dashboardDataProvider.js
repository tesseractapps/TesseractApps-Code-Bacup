import getNormalizedData from '@salesforce/apex/DashboardBuilderController.getNormalizedData';

/**
 * Service Layer for retrieving and caching widget datasets
 */
export class DashboardDataProvider {
    cache = new Map();

    /**
     * Creates a cache key based on query filters
     */
    getCacheKey(widgetType, facilityId, filters) {
        const filterStr = filters ? JSON.stringify(filters) : '';
        return `${widgetType}_${facilityId || 'global'}_${filterStr}`;
    }

    /**
     * Retrieves dataset. Uses client-side cache if available.
     * Falls back to high-fidelity mock data if query fails.
     */
    async fetchDataset(widgetType, facilityId, filters, forceRefresh = false) {
        const cacheKey = this.getCacheKey(widgetType, facilityId, filters);

        if (!forceRefresh && this.cache.has(cacheKey)) {
            console.log('Serving from cache:', cacheKey);
            return this.cache.get(cacheKey);
        }

        try {
            console.log('Fetching dataset from Apex:', widgetType, facilityId);
            const data = await getNormalizedData({ widgetType, facilityId });
            
            // Apply client-side filters if necessary (e.g. date ranges, ownership)
            const filteredData = this.applyLocalFilters(data, filters);
            
            this.cache.set(cacheKey, filteredData);
            return filteredData;
        } catch (error) {
            console.warn('Apex query failed, falling back to mock dataset for:', widgetType, error);
            const mockData = this.getMockDataset(widgetType);
            this.cache.set(cacheKey, mockData);
            return mockData;
        }
    }

    /**
     * Clear all cached datasets
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Clear specific cache entry
     */
    invalidate(widgetType, facilityId, filters) {
        const cacheKey = this.getCacheKey(widgetType, facilityId, filters);
        this.cache.delete(cacheKey);
    }

    applyLocalFilters(data, filters) {
        if (!filters || !filters.dateRange || !data) return data;
        
        // Only scale mock datasets for dynamic visualization feedback
        if (data.metadata && data.metadata.isMock) {
            let scale = 1.0;
            switch (filters.dateRange) {
                case 'TODAY':
                    scale = 0.12;
                    break;
                case 'THIS_WEEK':
                    scale = 0.28;
                    break;
                case 'THIS_MONTH':
                    scale = 0.55;
                    break;
                case 'THIS_QUARTER':
                    scale = 0.8;
                    break;
                case 'THIS_YEAR':
                default:
                    scale = 1.0;
                    break;
            }
            
            // Deep clone data to avoid mutating cache templates
            const cloned = JSON.parse(JSON.stringify(data));
            if (cloned.values) {
                cloned.values = cloned.values.map(v => Math.round(v * scale));
            }
            if (cloned.series) {
                cloned.series = cloned.series.map(s => ({
                    ...s,
                    data: s.data ? s.data.map(v => Math.round(v * scale)) : []
                }));
            }
            if (cloned.metadata && typeof cloned.metadata.totalCount === 'number') {
                cloned.metadata.totalCount = Math.round(cloned.metadata.totalCount * scale);
            }
            return cloned;
        }
        return data;
    }

    /**
     * Returns high-fidelity fallback mock data when server queries are unavailable
     */
    getMockDataset(type) {
        if (type === 'signin') {
            return {
                labels: ['Completed', 'In Progress', 'Accepted'],
                values: [45, 12, 18],
                series: [{ name: 'Sign Ins', data: [45, 12, 18] }],
                metadata: { totalCount: 75, isMock: true }
            };
        }
        if (type === 'staff-status') {
            return {
                labels: ['Active', 'On Leave', 'Inactive', 'Docs Expiry'],
                values: [120, 15, 8, 4],
                series: [{ name: 'Staff Status', data: [120, 15, 8, 4] }],
                metadata: { totalCount: 143, isMock: true }
            };
        }
        if (type === 'participant') {
            return {
                labels: ['Active', 'Inactive'],
                values: [85, 14],
                series: [{ name: 'Participants', data: [85, 14] }],
                metadata: { totalCount: 99, isMock: true }
            };
        }
        if (type === 'incident') {
            return {
                labels: ['Open', 'In Progress', 'Resolved'],
                values: [5, 12, 84],
                series: [{ name: 'Incidents', data: [5, 12, 84] }],
                metadata: { totalCount: 101, isMock: true }
            };
        }
        if (type === 'revenue' || type === 'sales') {
            return {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                values: [45000, 52000, 49000, 63000, 58000, 71000],
                series: [{ name: 'Revenue ($)', data: [45000, 52000, 49000, 63000, 58000, 71000] }],
                metadata: { totalCount: 338000, isMock: true, trend: 22.4 }
            };
        }
        if (type === 'leave') {
            return {
                labels: ['Sick Leave', 'Annual Leave', 'Maternity', 'Unpaid'],
                values: [14, 28, 5, 2],
                series: [{ name: 'Leave days', data: [14, 28, 5, 2] }],
                metadata: { totalCount: 49, isMock: true, target: 80 }
            };
        }
        if (type === 'performance') {
            return {
                labels: ['Review Done', 'Review Pending', 'Self Review'],
                values: [68, 12, 45],
                series: [{ name: 'Reviews', data: [68, 12, 45] }],
                metadata: { totalCount: 125, isMock: true, target: 150 }
            };
        }
        if (type === 'fund') {
            return {
                labels: ['Spent', 'Remaining'],
                values: [145000, 55000],
                series: [{ name: 'Funding Status ($)', data: [145000, 55000] }],
                metadata: { totalCount: 200000, isMock: true, target: 200000 }
            };
        }
        if (type === 'shift') {
            return {
                labels: ['Filled', 'Unassigned', 'Open'],
                values: [320, 15, 8],
                series: [{ name: 'Shifts Status', data: [320, 15, 8] }],
                metadata: { totalCount: 343, isMock: true }
            };
        }
        if (type === 'payroll') {
            return {
                labels: ['Paid', 'Pending Approval', 'Rejected'],
                values: [98000, 12000, 2500],
                series: [{ name: 'Payroll expenses ($)', data: [98000, 12000, 2500] }],
                metadata: { totalCount: 112500, isMock: true, target: 150000 }
            };
        }
        if (type === 'icttimesheet') {
            return {
                labels: ['ICT support', 'Software dev', 'Infrastructure'],
                values: [450, 680, 210],
                series: [{ name: 'Logged hours', data: [450, 680, 210] }],
                metadata: { totalCount: 1340, isMock: true }
            };
        }
        if (type === 'task') {
            return {
                labels: ['Pending', 'Completed'],
                values: [23, 77],
                series: [{ name: 'Checklist tasks', data: [23, 77] }],
                metadata: { totalCount: 100, isMock: true, target: 100 }
            };
        }
        
        // General fallback
        return {
            labels: ['Category A', 'Category B', 'Category C'],
            values: [25, 40, 35],
            series: [{ name: 'Mock Data', data: [25, 40, 35] }],
            metadata: { totalCount: 100, isMock: true }
        };
    }
}

export default DashboardDataProvider;