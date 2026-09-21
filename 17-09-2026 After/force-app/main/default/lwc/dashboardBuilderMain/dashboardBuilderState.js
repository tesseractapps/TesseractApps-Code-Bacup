// export const STANDARD_SLOTS = {
//     'shift': { title: 'Roster Manager', x: 0, y: 0, w: 4, h: 4, chartType: 'column' },
//     'incident': { title: 'Incident Register', x: 4, y: 0, w: 8, h: 2, chartType: 'bar' },
//     'staff-status': { title: 'Staff Details', x: 4, y: 2, w: 4, h: 2, chartType: 'bar' },
//     'signin': { title: 'Sign in', x: 8, y: 2, w: 4, h: 2, chartType: 'column' },
//     'leave': { title: 'Leave Management', x: 0, y: 4, w: 4, h: 3, chartType: 'column' },
//     'fund': { title: 'Funds Tracker', x: 4, y: 4, w: 4, h: 3, chartType: 'donut' },
//     'participant': { title: 'Participant Details', x: 8, y: 4, w: 4, h: 3, chartType: 'column' },
//     'hr': { title: 'Human Resources', x: 0, y: 7, w: 4, h: 2, chartType: 'kpi' },
//     'performance': { title: 'Performance Management', x: 4, y: 7, w: 4, h: 2, chartType: 'bar' },
//     'rejectedShifts': { title: 'Rejected Shifts', x: 8, y: 7, w: 4, h: 2, chartType: 'column' },
//     'participantSchedule': { title: 'Participant Schedule', x: 0, y: 0, w: 4, h: 4, chartType: 'kpi' },
//     'staffDashboard': { title: 'My Details', x: 0, y: 7, w: 4, h: 3, chartType: 'kpi' },
//     'task': { title: 'Tasks', x: 0, y: 9, w: 12, h: 4, chartType: 'kpi' }
// };

export const ROLE_DEFAULT_LAYOUTS = {
    'Roster Manager': {
        'shift': { title: 'Roster Manager', x: 0, y: 0, w: 4, h: 4, chartType: 'column' },
        'incident': { title: 'Incident Register', x: 4, y: 0, w: 8, h: 2, chartType: 'bar' },
        'signin': { title: 'Sign in', x: 4, y: 2, w: 4, h: 2, chartType: 'column' },
        'fund': { title: 'Funds Tracker', x: 8, y: 2, w: 4, h: 2, chartType: 'donut' },
        'hr': { title: 'Human Resources', x: 0, y: 4, w: 4, h: 3, chartType: 'kpi' },
        'performance': { title: 'Performance Management', x: 4, y: 4, w: 4, h: 3, chartType: 'bar' },
        'leave': { title: 'Leave Management', x: 8, y: 4, w: 4, h: 3, chartType: 'column' },
        'participant': { title: 'Participant Details', x: 0, y: 7, w: 12, h: 3, chartType: 'column' },
        'task': { title: 'Tasks', x: 0, y: 10, w: 12, h: 4, chartType: 'kpi' }
    },
    'NDIS Staff': {
        'participantSchedule': { title: 'Participant Schedule', x: 0, y: 0, w: 4, h: 4, chartType: 'kpi' },
        'incident': { title: 'Incident Register', x: 4, y: 0, w: 8, h: 2, chartType: 'bar' },
        'signin': { title: 'Sign in', x: 4, y: 2, w: 4, h: 2, chartType: 'column' },
        'leave': { title: 'Leave Management', x: 8, y: 2, w: 4, h: 5, chartType: 'column' },
        'staffDashboard': { title: 'My Details', x: 0, y: 4, w: 4, h: 3, chartType: 'kpi' },
        'performance': { title: 'Performance Management', x: 4, y: 4, w: 4, h: 3, chartType: 'bar' },
        'task': { title: 'Tasks', x: 0, y: 7, w: 12, h: 4, chartType: 'kpi' }
    },
    'ICT Admin': {
        'icttimesheet': { title: 'ICT Timesheet', x: 0, y: 0, w: 4, h: 4, chartType: 'kpi' },
        'staff-status': { title: 'Staff Details', x: 4, y: 0, w: 4, h: 2, chartType: 'bar' },
        'leave': { title: 'Leave Management', x: 4, y: 2, w: 4, h: 2, chartType: 'column' },
        'hr': { title: 'Human Resources', x: 8, y: 0, w: 4, h: 4, chartType: 'kpi' },
        'task': { title: 'Tasks', x: 0, y: 4, w: 12, h: 4, chartType: 'kpi' }
    },
    'ICT Staff': {
        'icttimesheet': { title: 'ICT Timesheet', x: 0, y: 0, w: 6, h: 4, chartType: 'kpi' },
        'leave': { title: 'Leave Management', x: 6, y: 0, w: 6, h: 4, chartType: 'column' }
    },

    'Facility Admin': {
        'shift': { title: 'Roster Manager', x: 0, y: 0, w: 4, h: 4, chartType: 'column' },
        'incident': { title: 'Incident Register', x: 4, y: 0, w: 8, h: 2, chartType: 'bar' },
        'staff-status': { title: 'Staff Details', x: 4, y: 2, w: 4, h: 2, chartType: 'bar' },
        'signin': { title: 'Sign in', x: 8, y: 2, w: 4, h: 2, chartType: 'column' },
        'leave': { title: 'Leave Management', x: 0, y: 4, w: 4, h: 3, chartType: 'column' },
        'fund': { title: 'Funds Tracker', x: 4, y: 4, w: 4, h: 3, chartType: 'donut' },
        'participant': { title: 'Participant Details', x: 8, y: 4, w: 4, h: 3, chartType: 'column' },
        'hr': { title: 'Human Resources', x: 0, y: 7, w: 4, h: 2, chartType: 'kpi' },
        'performance': { title: 'Performance Management', x: 4, y: 7, w: 4, h: 2, chartType: 'bar' },
        'rejectedShifts': { title: 'Rejected Shifts', x: 8, y: 7, w: 4, h: 2, chartType: 'column' },
        'task': { title: 'Tasks', x: 0, y: 9, w: 12, h: 4, chartType: 'kpi' }
    },
    'NDIS Org Admin': {
        'shift': { title: 'Roster Manager', x: 0, y: 0, w: 4, h: 4, chartType: 'column' },
        'incident': { title: 'Incident Register', x: 4, y: 0, w: 8, h: 2, chartType: 'bar' },
        'staff-status': { title: 'Staff Details', x: 4, y: 2, w: 4, h: 2, chartType: 'bar' },
        'signin': { title: 'Sign in', x: 8, y: 2, w: 4, h: 2, chartType: 'column' },
        'leave': { title: 'Leave Management', x: 0, y: 4, w: 4, h: 3, chartType: 'column' },
        'fund': { title: 'Funds Tracker', x: 4, y: 4, w: 4, h: 3, chartType: 'donut' },
        'participant': { title: 'Participant Details', x: 8, y: 4, w: 4, h: 3, chartType: 'column' },
        'hr': { title: 'Human Resources', x: 0, y: 7, w: 4, h: 2, chartType: 'kpi' },
        'performance': { title: 'Performance Management', x: 4, y: 7, w: 4, h: 2, chartType: 'bar' },
        'rejectedShifts': { title: 'Rejected Shifts', x: 8, y: 7, w: 4, h: 2, chartType: 'column' },
        'task': { title: 'Tasks', x: 0, y: 9, w: 12, h: 4, chartType: 'kpi' }
    },
    'Org Admin': {
        'shift': { title: 'Roster Manager', x: 0, y: 0, w: 4, h: 4, chartType: 'column' },
        'incident': { title: 'Incident Register', x: 4, y: 0, w: 8, h: 2, chartType: 'bar' },
        'staff-status': { title: 'Staff Details', x: 4, y: 2, w: 4, h: 2, chartType: 'bar' },
        'signin': { title: 'Sign in', x: 8, y: 2, w: 4, h: 2, chartType: 'column' },
        'leave': { title: 'Leave Management', x: 0, y: 4, w: 4, h: 3, chartType: 'column' },
        'fund': { title: 'Funds Tracker', x: 4, y: 4, w: 4, h: 3, chartType: 'donut' },
        'participant': { title: 'Participant Details', x: 8, y: 4, w: 4, h: 3, chartType: 'column' },
        'hr': { title: 'Human Resources', x: 0, y: 7, w: 4, h: 2, chartType: 'kpi' },
        'performance': { title: 'Performance Management', x: 4, y: 7, w: 4, h: 2, chartType: 'bar' },
        'rejectedShifts': { title: 'Rejected Shifts', x: 8, y: 7, w: 4, h: 2, chartType: 'column' },
        'task': { title: 'Tasks', x: 0, y: 9, w: 12, h: 4, chartType: 'kpi' }
    }
};


export const STANDARD_SLOTS = {
    'shift': { title: 'Roster Manager', x: 0, y: 0, w: 4, h: 4, chartType: 'column' },
    'incident': { title: 'Incident Register', x: 4, y: 0, w: 8, h: 2, chartType: 'bar' },
    'staff-status': { title: 'Staff Details', x: 4, y: 2, w: 4, h: 2, chartType: 'bar' },
    'signin': { title: 'Sign in', x: 4, y: 2, w: 4, h: 2, chartType: 'column' },
    'fund': { title: 'Funds Tracker', x: 8, y: 2, w: 4, h: 2, chartType: 'donut' },
    'hr': { title: 'Human Resources', x: 0, y: 4, w: 4, h: 3, chartType: 'kpi' },
    'performance': { title: 'Performance Management', x: 4, y: 4, w: 4, h: 3, chartType: 'bar' },
    'leave': { title: 'Leave Management', x: 8, y: 4, w: 4, h: 3, chartType: 'column' },
    'participant': { title: 'Participant Details', x: 0, y: 7, w: 12, h: 3, chartType: 'column' },
    'participantSchedule': { title: 'Participant Schedule', x: 0, y: 0, w: 4, h: 4, chartType: 'kpi' },
    'staffDashboard': { title: 'My Details', x: 0, y: 4, w: 4, h: 3, chartType: 'kpi' },
    'rejectedShifts': { title: 'Rejected Shifts', x: 8, y: 7, w: 4, h: 2, chartType: 'column' },
    'task': { title: 'Tasks', x: 0, y: 10, w: 12, h: 4, chartType: 'kpi' }
};


export class DashboardState {
    isEditMode = false;
    widgets = [];
    activeWidgetId = null;
    globalFilters = {
        dateRange: 'THIS_YEAR',
        region: 'All',
        ownerId: 'All'
    };
    
    // Undo / Redo Stacks (stores stringified representations of widgets layout)
    undoStack = [];
    redoStack = [];

    constructor(initialWidgets = [], isEditMode = false) {
        this.widgets = this.clone(initialWidgets);
        this.isEditMode = isEditMode;
    }

    /**
     * Deep clones an object safely.
     */
    clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Save the current state of widgets onto the undo stack.
     */
    pushState() {
        if (this.undoStack.length >= 50) {
            this.undoStack.shift(); // Evict oldest
        }
        this.undoStack.push(JSON.stringify(this.widgets));
        this.redoStack = []; // Clear redo stack on new user actions
    }

    /**
     * Undo the last widget change.
     */
    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(JSON.stringify(this.widgets));
            this.widgets = JSON.parse(this.undoStack.pop());
            return this.clone(this.widgets);
        }
        return null;
    }

    /**
     * Redo the last undone change.
     */
    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(JSON.stringify(this.widgets));
            this.widgets = JSON.parse(this.redoStack.pop());
            return this.clone(this.widgets);
        }
        return null;
    }



    get hasUndo() {
        return this.undoStack.length > 0;
    }

    get indexCount() {
        return this.widgets.length;
    }

    get getWidgets() {
        return this.clone(this.widgets);
    }

    setWidgets(newWidgets) {
        this.widgets = this.clone(newWidgets);
        this.undoStack = [];
        this.redoStack = [];
    }

    reset(newWidgets = []) {
        this.setWidgets(newWidgets);
    }


    getSlotForType(type, role = null) {
        if (role && ROLE_DEFAULT_LAYOUTS[role] && ROLE_DEFAULT_LAYOUTS[role][type]) {
            return ROLE_DEFAULT_LAYOUTS[role][type];
        }
        return STANDARD_SLOTS[type] || null;
    }

    /**
     * Add multiple widgets to layout (e.g. from library selection).
     */
    addMultipleWidgets(types, allWidgetTypes = {}, role = null) {
        this.pushState();

        types.forEach((type, idx) => {
            const slot = this.getSlotForType(type, role);
            const label = allWidgetTypes[type] || (slot ? slot.title : type);
            const defaultChart = slot ? slot.chartType : this.getDefaultChartType(type);
            const w = slot ? slot.w : 4;
            const h = slot ? slot.h : 3;

            let x = slot ? slot.x : null;
            let y = slot ? slot.y : null;

            if (x === null || y === null || this.checkOverlap({ x, y, w, h })) {
                const pos = this.findFirstFreePosition(w, h);
                x = pos.x;
                y = pos.y;
            }

            const newId = `${type}-${Date.now()}-${idx}`;
            this.widgets.push({
                id: newId,
                type: type,
                title: label,
                subtitle: '',
                x: x,
                y: y,
                w: w,
                h: h,
                chartType: defaultChart,
                properties: {
                    object: this.getDefaultObject(type),
                    theme: 'light',
                    aggregation: 'COUNT',
                    field: 'Id',
                    refreshInterval: 0,
                    showLegend: true,
                    showTooltips: true
                }
            });
        });

        this.compactLayout();
    }

    /**
     * Add a widget to the dashboard layout.
     */
    addWidget(type, title, w = null, h = null, role = null) {
        this.pushState();
        
        const slot = this.getSlotForType(type, role);
        let finalW = w || (slot ? slot.w : 4);
        let finalH = h || (slot ? slot.h : 3);
        
        let x = slot ? slot.x : null;
        let y = slot ? slot.y : null;

        if (this.widgets.length === 0) {
            // First widget always starts cleanly at (0, 0)
            x = 0;
            y = 0;
        } else if (x === null || y === null || this.checkOverlap({ x, y, w: finalW, h: finalH })) {
            const pos = this.findFirstFreePosition(finalW, finalH);
            x = pos.x;
            y = pos.y;
        }

        const newId = `${type}-${Date.now()}`;
        const newWidget = {
            id: newId,
            type: type,
            title: title || (slot ? slot.title : type),
            subtitle: '',
            x: x,
            y: y,
            w: finalW,
            h: finalH,
            chartType: slot ? slot.chartType : this.getDefaultChartType(type),
            properties: {
                object: this.getDefaultObject(type),
                theme: 'light',
                aggregation: 'COUNT',
                field: 'Id',
                refreshInterval: 0,
                showLegend: true,
                showTooltips: true
            }
        };

        this.widgets.push(newWidget);
        this.resolveDirectCollisions(newId);
        return newWidget;
    }

    deleteWidget(widgetId) {
        const deletedWidget = this.widgets.find(w => w.id === widgetId);
        if (!deletedWidget) return;

        this.pushState();
        this.widgets = this.widgets.filter(w => w.id !== widgetId);
        if (this.activeWidgetId === widgetId) {
            this.activeWidgetId = null;
        }
        this.compactLayout();
    }

    /**
     * Duplicate a widget.
     */
    duplicateWidget(widgetId) {
        const source = this.widgets.find(w => w.id === widgetId);
        if (!source) return null;

        this.pushState();
        const cloneWidget = this.clone(source);
        cloneWidget.id = `${source.type}-${Date.now()}`;
        cloneWidget.title = `${source.title} (Copy)`;
        
        const pos = this.findFirstFreePosition(source.w, source.h);
        cloneWidget.x = pos.x;
        cloneWidget.y = pos.y;

        this.widgets.push(cloneWidget);
        this.resolveDirectCollisions(cloneWidget.id);
        return cloneWidget;
    }

    /**
     * Select a widget for the property panel.
     */
    selectWidget(widgetId) {
        this.activeWidgetId = widgetId;
    }

    /**
     * Update layout properties (x, y, w, h) for a specific widget.
     */
    updateWidgetLayout(widgetId, x, y, w, h) {
        const widget = this.widgets.find(w => w.id === widgetId);
        if (!widget) return false;

        this.pushState();

        const origX = widget.x;
        const origY = widget.y;

        let finalX = Math.max(0, Math.min(11, x));
        let finalW = Math.max(1, Math.min(12, w));
        let finalH = Math.max(1, h);
        let finalY = Math.max(0, y);

        // Align to 4-column intervals for standard 4-wide cards to avoid empty column slivers
        if (finalW === 4) {
            finalX = Math.round(finalX / 4) * 4;
        } else if (finalW === 8) {
            finalX = Math.round(finalX / 4) * 4;
            if (finalX > 4) finalX = 4;
        } else if (finalW === 6) {
            finalX = Math.round(finalX / 6) * 6;
        } else if (finalW >= 12) {
            finalX = 0;
        }

        if (finalX + finalW > 12) {
            finalX = 12 - finalW;
        }

        // 1. Direct SWAP: If moving widget onto an existing widget of matching size, swap places!
        const targetOverlapped = this.widgets.find(other => 
            other.id !== widgetId &&
            finalX < other.x + other.w &&
            finalX + finalW > other.x &&
            finalY < other.y + other.h &&
            finalY + finalH > other.y
        );

        if (targetOverlapped && targetOverlapped.w === finalW && targetOverlapped.h === finalH) {
            // Swap positions cleanly with zero leftover gap
            targetOverlapped.x = origX;
            targetOverlapped.y = origY;
            widget.x = finalX;
            widget.y = finalY;
            widget.w = finalW;
            widget.h = finalH;
            this.compactLayout();
            return true;
        }

        // 2. Normal move & collision resolution
        widget.x = finalX;
        widget.y = finalY;
        widget.w = finalW;
        widget.h = finalH;

        this.resolveDirectCollisions(widgetId);
        this.compactLayout();
        return true;
    }

    compactLayout() {
        let changed = true;
        let guard = 0;
        while (changed && guard < 60) {
            guard++;
            changed = false;

            // Sort all widgets top-to-bottom, then left-to-right
            this.widgets.sort((a, b) => {
                if (a.y !== b.y) return a.y - b.y;
                return a.x - b.x;
            });

            // Find lowest available y and leftmost available x across candidate columns
            for (const w of this.widgets) {
                let candidateCols = [0];
                if (w.w === 4) {
                    candidateCols = [0, 4, 8];
                } else if (w.w === 8) {
                    candidateCols = [0, 4];
                } else if (w.w === 6) {
                    candidateCols = [0, 6];
                } else if (w.w >= 12) {
                    candidateCols = [0];
                } else {
                    candidateCols = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(col => col + w.w <= 12);
                }

                let bestY = w.y;
                let bestX = w.x;

                // Search for lowest possible y, and leftmost possible x
                for (let testY = 0; testY <= w.y; testY++) {
                    for (const testX of candidateCols) {
                        // In the same row, only consider positions to the left of current x
                        if (testY === w.y && testX >= w.x) {
                            continue;
                        }
                        const testRect = { x: testX, y: testY, w: w.w, h: w.h };
                        if (!this.checkOverlap(testRect, w.id)) {
                            bestY = testY;
                            bestX = testX;
                            break;
                        }
                    }
                    if (bestY < w.y) {
                        break;
                    }
                }

                if (bestY < w.y || (bestY === w.y && bestX < w.x)) {
                    w.x = bestX;
                    w.y = bestY;
                    changed = true;
                }
            }
        }
    }

    resolveDirectCollisions(movedId) {
        let changed = true;
        let guard = 0;
        while (changed && guard < 30) {
            guard++;
            changed = false;
            for (let i = 0; i < this.widgets.length; i++) {
                const a = this.widgets[i];
                for (let j = 0; j < this.widgets.length; j++) {
                    if (i === j) continue;
                    const b = this.widgets[j];
                    // Overlap check
                    if (
                        a.x < b.x + b.w &&
                        a.x + a.w > b.x &&
                        a.y < b.y + b.h &&
                        a.y + a.h > b.y
                    ) {
                        if (a.id === movedId) {
                            b.y = a.y + a.h;
                            changed = true;
                        } else if (b.id === movedId) {
                            a.y = b.y + b.h;
                            changed = true;
                        } else if (a.y <= b.y) {
                            b.y = a.y + a.h;
                            changed = true;
                        } else {
                            a.y = b.y + b.h;
                            changed = true;
                        }
                    }
                }
            }
        }
    }

    /**
     * Update dynamic settings for a widget.
     */
    updateWidgetProperties(widgetId, props) {
        const widget = this.widgets.find(w => w.id === widgetId);
        if (widget) {
            this.pushState();
            widget.properties = { ...widget.properties, ...props };
            if (props.title !== undefined) widget.title = props.title;
            if (props.subtitle !== undefined) widget.subtitle = props.subtitle;
            if (props.chartType !== undefined) widget.chartType = props.chartType;
            return true;
        }
        return false;
    }

    /**
     * Update global filter parameters.
     */
    setGlobalFilter(filterKey, value) {
        this.globalFilters[filterKey] = value;
    }

    /**
     * Snaps pixel positioning values into 12-column grid coordinate equivalents.
     */
    snapToGrid(xPx, yPx, widthPx, heightPx, gridColWidth, gridRowHeight, colGap) {
        const col = Math.max(0, Math.min(11, Math.round(xPx / (gridColWidth + colGap))));
        const row = Math.max(0, Math.round(yPx / (gridRowHeight + colGap)));
        const wCols = Math.max(1, Math.min(12, Math.round(widthPx / (gridColWidth + colGap))));
        const hRows = Math.max(1, Math.round(heightPx / (gridRowHeight + colGap)));

        return { x: col, y: row, w: wCols, h: hRows };
    }

    /**
     * Find first available empty slot starting from the top-left (0,0) in 12-column layout.
     */
    findFirstFreePosition(w, h) {
        let y = 0;
        while (true) {
            for (let x = 0; x <= 12 - w; x++) {
                const rect = { x, y, w, h };
                if (!this.checkOverlap(rect)) {
                    return { x, y };
                }
            }
            y++;
        }
    }

    checkOverlap(rect, excludeId = null) {
        return this.widgets.some(w => {
            if (w.id === excludeId) return false;
            return (
                rect.x < w.x + w.w &&
                rect.x + rect.w > w.x &&
                rect.y < w.y + w.h &&
                rect.y + rect.h > w.y
            );
        });
    }

    /**
     * Vertical compaction layout collision resolver (pushes overlapping widgets DOWN).
     */
    resolveCollisions(fixedId) {
        let changed = true;
        let guard = 0;

        while (changed && guard++ < 100) {
            changed = false;

            // Sort widgets: Fixed item first, then top-to-bottom
            this.widgets.sort((a, b) => {
                if (a.id === fixedId) return -1;
                if (b.id === fixedId) return 1;
                if (a.y !== b.y) return a.y - b.y;
                return a.x - b.x;
            });

            for (let i = 0; i < this.widgets.length; i++) {
                for (let j = i + 1; j < this.widgets.length; j++) {
                    const a = this.widgets[i];
                    const b = this.widgets[j];

                    if (b.id === fixedId) continue; // Immovable anchor

                    // Overlaps?
                    if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
                        const newY = a.y + a.h;
                        if (b.y < newY) {
                            b.y = newY;
                            changed = true;
                        }
                    }
                }
            }
        }
    }

    getDefaultChartType(type) {
        if (['staff-status', 'performance', 'incident'].includes(type)) return 'bar';
        if (type === 'fund') return 'donut';
        if (type === 'payroll') return 'line';
        if (['shift', 'leave', 'rejectedShifts', 'participant', 'signin'].includes(type)) return 'column';
        return 'kpi';
    }

    getDefaultObject(type) {
        if (type === 'signin') return 'ShiftwithStaff__c';
        if (type === 'staff-status') return 'Staff__c';
        if (type === 'participant') return 'Client__c';
        if (type === 'incident') return 'Case';
        return '';
    }
}