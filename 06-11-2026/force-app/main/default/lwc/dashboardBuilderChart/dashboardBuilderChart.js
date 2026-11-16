/* global Chart */
import { LightningElement, api, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/chratJs';

export default class DashboardBuilderChart extends LightningElement {
    _chartType = 'column';
    _chartData;
    resizeObserver;

    @api
    get chartType() {
        return this._chartType;
    }
    set chartType(value) {
        this._chartType = value;
        this.watchProperties();
    }

    @api
    get chartData() {
        return this._chartData;
    }
    set chartData(value) {
        this._chartData = value;
        this.watchProperties();
    }

    _options = {};

    @api
    get options() {
        return this._options;
    }
    set options(value) {
        this._options = value || {};
        this.watchProperties();
    }

    isChartJsLoaded = false;
    chartInstance = null;

    @track ringDashArray = '0, 100';
    @track ringPercentage = 0;
    @track gaugeDashArray = '0, 100';
    @track gaugePercentage = 0;
    @track gaugeNeedleTransform = 'rotate(-90)';

    // Computed checks
    get isSvgProgressRing() {
        return this.chartType === 'progress-ring';
    }

    get isSvgGauge() {
        return this.chartType === 'gauge';
    }

    get isCanvasChart() {
        return !this.isSvgProgressRing && !this.isSvgGauge;
    }

    watchProperties() {
        if (this.isSvgProgressRing) {
            this.renderProgressRing();
        } else if (this.isSvgGauge) {
            this.renderGauge();
        } else if (this.isChartJsLoaded) {
            // Debounce render to allow canvas node mounting
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(() => this.initializeChart(), 50);
        }
    }

    // React to property changes
    lifecycleRendered = false;
    renderedCallback() {
        if (this.lifecycleRendered) {
            this.watchProperties();
            return;
        }
        this.lifecycleRendered = true;

        if (this.isCanvasChart) {
            loadScript(this, ChartJS)
                .then(() => {
                    this.isChartJsLoaded = true;
                    this.initializeChart();
                    this.setupResizeObserver();
                })
                .catch(error => {
                    console.error('Error loading Chart.js static resource:', error);
                });
        } else {
            this.watchProperties();
        }
    }

    disconnectedCallback() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    // Custom SVG Progress Ring calculation
    renderProgressRing() {
        const val = this.chartData?.values?.[0] || 0;
        const max = this.chartData?.metadata?.target || 100;
        const pct = Math.min(100, Math.max(0, Math.round((val / max) * 100)));
        this.ringPercentage = pct;
        
        // Circumference is 2 * Math.PI * 40 = 251.2
        const strokeDash = (pct / 100) * 251.2;
        this.ringDashArray = `${strokeDash}, 251.2`;
    }

    // Custom SVG Gauge calculation
    renderGauge() {
        const val = this.chartData?.values?.[0] || 0;
        const max = this.chartData?.metadata?.target || 100;
        const pct = Math.min(100, Math.max(0, Math.round((val / max) * 100)));
        this.gaugePercentage = pct;

        // Bounded semicircle dash array (stroke dash for arc length 157.08)
        const strokeDash = (pct / 100) * 157.08;
        this.gaugeDashArray = `${strokeDash}, 157.08`;

        // Needle rotation angle (-90 deg for 0%, 90 deg for 100%)
        const deg = -90 + (pct / 100) * 180;
        this.gaugeNeedleTransform = `rotate(${deg})`;
    }

    // Chart.js V2.x dynamic renderer
    initializeChart() {
        const canvas = this.template.querySelector('canvas.chart-canvas');
        if (!canvas) return;

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const ctx = canvas.getContext('2d');
        const config = this.buildChartConfig(ctx);
        
        try {
            this.chartInstance = new Chart(ctx, config);
        } catch (e) {
            console.error('Chart.js render exception:', e);
        }
    }

    setupResizeObserver() {
        const container = this.template.querySelector('.canvas-container');
        if (container && window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                if (this.chartInstance) {
                    this.chartInstance.resize();
                }
            });
            this.resizeObserver.observe(container);
        }
    }

    getColorForLabel(label, index = 0) {
        const colorMap = {
            'completed': '#10b981', // green
            'active': '#10b981', // green
            'resolved': '#10b981', // green
            'approved': '#10b981', // green
            
            'accepted': '#0ea5e9', // sky blue
            
            'in progress': '#f59e0b', // amber/orange
            
            'unassigned': '#64748b', // slate
            
            'open': '#ef4444', // red
            'rejected': '#ef4444', // red
            'inactive': '#ef4444', // red
            
            'on leave': '#eab308', // gold/yellow
            'requested': '#8b5cf6', // purple
            'docs expiry': '#ec4899' // pink
        };
        
        const palette = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#a855f7'];
        
        if (!label) return palette[index % palette.length];
        const key = label.toLowerCase().trim();
        return colorMap[key] || palette[index % palette.length];
    }

    getColorsForLabels(labels) {
        return labels.map((label, idx) => this.getColorForLabel(label, idx));
    }

    buildChartConfig(ctx) {
        const type = this.chartType;
        
        // Deep clone data to unwrap Salesforce LWC Locker Service Read-only Proxies
        const data = this.chartData 
            ? JSON.parse(JSON.stringify(this.chartData)) 
            : { labels: [], values: [] };
        
        // Map widget chart type to ChartJS V2 type
        let cjsType = 'bar';
        if (type === 'bar') cjsType = 'horizontalBar';
        if (type === 'column') cjsType = 'bar';
        if (type === 'line' || type === 'area') cjsType = 'line';
        if (type === 'pie') cjsType = 'pie';
        if (type === 'donut') cjsType = 'doughnut';
        if (type === 'stacked-column') cjsType = 'bar';
        if (type === 'stacked-bar') cjsType = 'horizontalBar';

        const labels = data.labels || [];
        const values = data.values || [];
        
        const palette = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#a855f7'];

        // Build dataset configurations
        const datasets = [];
        if (data.series && data.series.length > 1) {
            // Multi-series chart (e.g. stacked charts)
            data.series.forEach((s, idx) => {
                const color = this.getColorForLabel(s.name, idx);
                datasets.push({
                    label: s.name,
                    data: s.data,
                    backgroundColor: type === 'area' ? this.getGradientColor(ctx, color) : color,
                    borderColor: color,
                    borderWidth: 1.5,
                    fill: type === 'area'
                });
            });
        } else {
            // Single series chart or flat dataset chart
            const rawData = (data.series && data.series.length === 1) ? data.series[0].data : values;
            const seriesLabel = (data.series && data.series.length === 1) ? data.series[0].name : 'Metric Value';
            
            const colors = this.getColorsForLabels(labels);
            
            datasets.push({
                label: seriesLabel,
                data: rawData,
                backgroundColor: type === 'area' ? this.getGradientColor(ctx, colors[0] || palette[0]) : colors,
                borderColor: type === 'area' ? (colors[0] || palette[0]) : colors,
                pointBackgroundColor: colors,
                pointBorderColor: colors,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
                fill: type === 'area',
                _originalColors: colors
            });
        }

        const scalesConfig = {};
        if (cjsType !== 'pie' && cjsType !== 'doughnut') {
            const isStacked = type.includes('stacked');
            scalesConfig.xAxes = [{
                stacked: isStacked,
                gridLines: { color: 'rgba(226, 232, 240, 0.4)' },
                ticks: { fontFamily: 'Outfit, sans-serif', fontSize: 11 }
            }];
            scalesConfig.yAxes = [{
                stacked: isStacked,
                gridLines: { color: 'rgba(226, 232, 240, 0.4)' },
                ticks: { 
                    beginAtZero: true,
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: 11
                }
            }];
        }

        const isClickable = this.options?.isClickable === true;

        const chartOptionsObj = {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                    display: this.options.showLegend !== false,
                    position: 'bottom',
                    labels: { 
                        boxWidth: 12, 
                        fontFamily: 'Outfit, sans-serif', 
                        fontSize: 11,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                const dataset = data.datasets[0];
                                const labelColors = dataset._originalColors || (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor : null);
                                if (data.datasets.length === 1 && labelColors) {
                                    return data.labels.map(function(label, i) {
                                        const isHidden = (chart._hiddenDataMap && chart._hiddenDataMap[i] !== undefined) || 
                                                         (chart.getDatasetMeta(0).data[i] && chart.getDatasetMeta(0).data[i].hidden);
                                        const itemColor = labelColors[i] || dataset.borderColor;
                                        return {
                                            text: label,
                                            fillStyle: itemColor,
                                            strokeStyle: itemColor,
                                            lineWidth: dataset.borderWidth || 1,
                                            hidden: isHidden,
                                            index: i
                                        };
                                    });
                                }
                            }
                            return Chart.defaults.global.legend.labels.generateLabels(chart);
                        }
                    },
                    onClick: function(e, legendItem) {
                        const chart = this.chart;
                        if (chart.data.datasets.length === 1 && legendItem.index !== undefined) {
                            const index = legendItem.index;
                            const meta = chart.getDatasetMeta(0);
                            if (!chart._hiddenDataMap) {
                                chart._hiddenDataMap = {};
                            }
                            const dataset = chart.data.datasets[0];
                            if (chart._hiddenDataMap[index] !== undefined) {
                                // Restore original value
                                dataset.data[index] = chart._hiddenDataMap[index];
                                delete chart._hiddenDataMap[index];
                                if (meta.data && meta.data[index]) {
                                    meta.data[index].hidden = false;
                                }
                            } else {
                                // Hide value
                                chart._hiddenDataMap[index] = dataset.data[index];
                                dataset.data[index] = null;
                                if (meta.data && meta.data[index]) {
                                    meta.data[index].hidden = true;
                                }
                            }
                            chart.update();
                        } else {
                            const datasetIndex = legendItem.datasetIndex;
                            const meta = chart.getDatasetMeta(datasetIndex);
                            if (meta) {
                                meta.hidden = meta.hidden === null ? !chart.data.datasets[datasetIndex].hidden : null;
                                chart.update();
                            }
                        }
                    }
                },
                tooltips: {
                    enabled: this.options.showTooltips !== false,
                    titleFontFamily: 'Outfit, sans-serif',
                    bodyFontFamily: 'Outfit, sans-serif'
                },
                scales: scalesConfig
        };

        chartOptionsObj.onClick = (event, elements) => {
            if (this.options?.isClickable !== false && elements && elements.length > 0) {
                const element = elements[0];
                const index = element._index !== undefined ? element._index : element.index;
                const datasetIndex = element._datasetIndex !== undefined ? element._datasetIndex : element.datasetIndex;
                const label = labels && labels.length ? labels[index] : null;
                const rawData = (data.series && data.series.length === 1) ? data.series[0].data : values;
                const value = rawData ? rawData[index] : null;
                this.dispatchEvent(new CustomEvent('chartclick', {
                    detail: { label, value, index, datasetIndex },
                    bubbles: true,
                    composed: true
                }));
            }
        };
        chartOptionsObj.onHover = (event, chartElement) => {
            if (this.options?.isClickable !== false && event && event.target) {
                event.target.style.cursor = (chartElement && chartElement.length) ? 'pointer' : 'default';
            }
        };

        return {
            type: cjsType,
            data: {
                labels: labels,
                datasets: datasets
            },
            options: chartOptionsObj
        };
    }

    getGradientColor(ctx, hexColor) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, this.hexToRgbA(hexColor, 0.45));
        gradient.addColorStop(1, this.hexToRgbA(hexColor, 0.02));
        return gradient;
    }

    hexToRgbA(hex, alpha) {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
        }
        return hex;
    }
}