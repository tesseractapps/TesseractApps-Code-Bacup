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
            // console.warn('Apex query failed, falling back to mock dataset for:', widgetType, error);
            // const mockData = this.getMockDataset(widgetType);
            // this.cache.set(cacheKey, mockData);
            // return mockData;
            console.error('Apex query failed for widget:', widgetType, error);
            const emptyData = {
                labels: [],
                values: [],
                series: [],
                metadata: { totalCount: 0 }
            };
            this.cache.set(cacheKey, emptyData);
            return emptyData;            
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

    /**
     * Perform client-side filter computation to reduce database CPU/query load
     */
    applyLocalFilters(data, filters) {
        if (!filters) return data;
        // In future phases, we can filter date fields or owners locally from the dataset metadata
        return data;
    }

    /**
     * Returns high-fidelity fallback mock data when server queries are unavailable
     */
    // getMockDataset(type) {
    //     if (type === 'signin') {
    //         return {
    //             labels: ['Completed', 'In Progress', 'Accepted'],
    //             values: [45, 12, 18],
    //             series: [{ name: 'Sign Ins', data: [45, 12, 18] }],
    //             metadata: { totalCount: 75, isMock: true }
    //         };
    //     }
    //     if (type === 'staff-status') {
    //         return {
    //             labels: ['Active', 'On Leave', 'Inactive', 'Docs Expiry'],
    //             values: [120, 15, 8, 4],
    //             series: [{ name: 'Staff Status', data: [120, 15, 8, 4] }],
    //             metadata: { totalCount: 143, isMock: true }
    //         };
    //     }
    //     if (type === 'participant') {
    //         return {
    //             labels: ['Active', 'Inactive'],
    //             values: [85, 14],
    //             series: [{ name: 'Participants', data: [85, 14] }],
    //             metadata: { totalCount: 99, isMock: true }
    //         };
    //     }
    //     if (type === 'incident') {
    //         return {
    //             labels: ['Open', 'In Progress', 'Resolved'],
    //             values: [5, 12, 84],
    //             series: [{ name: 'Incidents', data: [5, 12, 84] }],
    //             metadata: { totalCount: 101, isMock: true }
    //         };
    //     }
    //     if (type === 'revenue' || type === 'sales') {
    //         return {
    //             labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    //             values: [45000, 52000, 49000, 63000, 58000, 71000],
    //             series: [{ name: 'Revenue ($)', data: [45000, 52000, 49000, 63000, 58000, 71000] }],
    //             metadata: { totalCount: 338000, isMock: true, trend: 22.4, trendDirection: 'up' }
    //         };
    //     }
        
    //     // General fallback
    //     return {
    //         labels: ['Category A', 'Category B', 'Category C'],
    //         values: [25, 40, 35],
    //         series: [{ name: 'Mock Data', data: [25, 40, 35] }],
    //         metadata: { totalCount: 100, isMock: true }
    //     };
    // }
}