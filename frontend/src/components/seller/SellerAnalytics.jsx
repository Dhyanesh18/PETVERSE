import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Chart from 'chart.js/auto';
import './SellerAnalytics.css';

const SellerAnalytics = () => {
    const { orders, products, statistics } = useSelector(state => state.seller);
    
    // Chart refs
    const salesTrendRef = useRef(null);
    const productPerformanceRef = useRef(null);
    const categoryDistributionRef = useRef(null);
    const revenueByMonthRef = useRef(null);
    
    const chartInstances = useRef({});
    const [topProducts, setTopProducts] = useState([]);
    const [categoryStats, setCategoryStats] = useState({});
    const [monthlyData, setMonthlyData] = useState({ labels: [], data: [] });
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [filteredMonthlyData, setFilteredMonthlyData] = useState({ labels: [], data: [] });
    const [growthMetrics, setGrowthMetrics] = useState({
        revenueGrowth: 0,
        orderGrowth: 0,
        avgOrderGrowth: 0
    });

    useEffect(() => {
        // Calculate analytics data
        if (orders && orders.length > 0) {
            calculateAnalytics();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders, products]);

    useEffect(() => {
        // Filter monthly data based on selected month
        if (selectedMonth === 'all') {
            setFilteredMonthlyData(monthlyData);
        } else {
            const monthsToShow = parseInt(selectedMonth);
            
            // Get the last N months of data
            const filtered = {
                labels: monthlyData.labels.slice(-monthsToShow),
                data: monthlyData.data.slice(-monthsToShow)
            };
            
            setFilteredMonthlyData(filtered);
        }
    }, [selectedMonth, monthlyData]);

    useEffect(() => {
        // Create charts after data is calculated
        if (topProducts.length > 0) {
            createCharts();
        }

        // Save reference for cleanup
        const currentCharts = chartInstances.current;

        // Cleanup on unmount
        return () => {
            Object.values(currentCharts).forEach(chart => {
                if (chart) chart.destroy();
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topProducts, categoryStats, filteredMonthlyData]);

    const calculateAnalytics = () => {
        // Create a product lookup map for actual product categories
        const productMap = {};
        if (products && Array.isArray(products)) {
            products.forEach(product => {
                productMap[product._id] = {
                    category: product.category || 'Uncategorized',
                    name: product.name
                };
            });
        }

        // Calculate product purchases
        const productPurchases = {};
        const categoryRevenue = {};
        const monthlyRevenue = {};

        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const productId = item.product?._id || item.productId;
                    const productInfo = productMap[productId];
                    const productName = item.product?.name || productInfo?.name || 'Unknown Product';
                    const category = productInfo?.category || item.product?.category || 'Uncategorized';
                    const quantity = item.quantity || 1;
                    const price = item.price || 0;
                    const revenue = quantity * price;

                    // Track product purchases
                    if (!productPurchases[productId]) {
                        productPurchases[productId] = {
                            name: productName,
                            quantity: 0,
                            revenue: 0,
                            category: category
                        };
                    }
                    productPurchases[productId].quantity += quantity;
                    productPurchases[productId].revenue += revenue;

                    // Track category revenue
                    categoryRevenue[category] = (categoryRevenue[category] || 0) + revenue;
                });
            }

            // Track monthly revenue
            if (order.createdAt) {
                const orderDate = new Date(order.createdAt);
                const monthKey = `${orderDate.getMonth()}-${orderDate.getFullYear()}`;
                if (!monthlyRevenue[monthKey]) {
                    monthlyRevenue[monthKey] = {
                        date: orderDate,
                        revenue: 0
                    };
                }
                monthlyRevenue[monthKey].revenue += (order.totalAmount || 0);
            }
        });

        // Get top 10 products
        const sortedProducts = Object.entries(productPurchases)
            .sort((a, b) => b[1].quantity - a[1].quantity)
            .slice(0, 10)
            .map(([id, data]) => ({ id, ...data }));

        setTopProducts(sortedProducts);
        setCategoryStats(categoryRevenue);

        // Generate last 12 months including current month
        const currentDate = new Date();
        const last12Months = [];
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = `${date.getMonth()}-${date.getFullYear()}`;
            const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            last12Months.push({
                label: label,
                revenue: monthlyRevenue[monthKey]?.revenue || 0
            });
        }
        
        const monthData = {
            labels: last12Months.map(m => m.label),
            data: last12Months.map(m => m.revenue)
        };
        
        setMonthlyData(monthData);
        setFilteredMonthlyData(monthData);

        // Calculate growth metrics (current month vs previous month)
        const currentMonthRevenue = last12Months[11]?.revenue || 0; // Current month (most recent)
        const previousMonthRevenue = last12Months[10]?.revenue || 0; // Previous month
        
        const currentMonthOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        }).length;

        const previousMonthOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            const prevMonth = new Date().getMonth() - 1;
            const prevYear = prevMonth < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
            return orderDate.getMonth() === (prevMonth < 0 ? 11 : prevMonth) && orderDate.getFullYear() === prevYear;
        }).length;

        const revenueGrowth = previousMonthRevenue > 0 
            ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100) 
            : currentMonthRevenue > 0 ? 100 : 0;

        const orderGrowth = previousMonthOrders > 0
            ? ((currentMonthOrders - previousMonthOrders) / previousMonthOrders * 100)
            : currentMonthOrders > 0 ? 100 : 0;

        const currentAvgOrder = currentMonthOrders > 0 ? currentMonthRevenue / currentMonthOrders : 0;
        const previousAvgOrder = previousMonthOrders > 0 ? previousMonthRevenue / previousMonthOrders : 0;
        const avgOrderGrowth = previousAvgOrder > 0
            ? ((currentAvgOrder - previousAvgOrder) / previousAvgOrder * 100)
            : currentAvgOrder > 0 ? 100 : 0;

        setGrowthMetrics({
            revenueGrowth: revenueGrowth,
            orderGrowth: orderGrowth,
            avgOrderGrowth: avgOrderGrowth
        });
    };

    const createCharts = () => {
        // Destroy existing charts
        Object.values(chartInstances.current).forEach(chart => {
            if (chart) chart.destroy();
        });

        // Sales Trend Chart (Line) - Always shows all 12 months
        if (salesTrendRef.current && monthlyData.labels.length > 0) {
            const ctx = salesTrendRef.current.getContext('2d');
            chartInstances.current.salesTrend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: monthlyData.labels,
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: monthlyData.data,
                        borderColor: '#14b8a6',
                        backgroundColor: 'rgba(20, 184, 166, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#14b8a6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Last 12 Months',
                            font: { size: 12, weight: 'normal' },
                            color: '#6b7280',
                            padding: { bottom: 10 }
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(20, 184, 166, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: (context) => 'Revenue: ₹' + context.parsed.y.toLocaleString()
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => '₹' + value.toLocaleString()
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Product Performance Chart (Bar)
        if (productPerformanceRef.current && topProducts.length > 0) {
            const ctx = productPerformanceRef.current.getContext('2d');
            const top5 = topProducts.slice(0, 5);
            
            chartInstances.current.productPerformance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: top5.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
                    datasets: [{
                        label: 'Units Sold',
                        data: top5.map(p => p.quantity),
                        backgroundColor: [
                            'rgba(20, 184, 166, 0.8)',
                            'rgba(6, 182, 212, 0.8)',
                            'rgba(8, 145, 178, 0.8)',
                            'rgba(14, 116, 144, 0.8)',
                            'rgba(21, 94, 117, 0.8)'
                        ],
                        borderRadius: 8,
                        barThickness: 40
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(20, 184, 166, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: (context) => 'Sold: ' + context.parsed.y + ' units'
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Category Distribution Chart (Doughnut)
        if (categoryDistributionRef.current && Object.keys(categoryStats).length > 0) {
            const ctx = categoryDistributionRef.current.getContext('2d');
            const categories = Object.keys(categoryStats);
            const revenues = Object.values(categoryStats);
            
            chartInstances.current.categoryDistribution = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categories,
                    datasets: [{
                        data: revenues,
                        backgroundColor: [
                            '#14b8a6',
                            '#06b6d4',
                            '#0891b2',
                            '#0e7490',
                            '#155e75',
                            '#164e63'
                        ],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: { size: 11 },
                                generateLabels: function(chart) {
                                    const data = chart.data;
                                    if (data.labels.length && data.datasets.length) {
                                        return data.labels.map((label, i) => {
                                            const value = data.datasets[0].data[i];
                                            return {
                                                text: `${label}: ₹${value.toLocaleString()}`,
                                                fillStyle: data.datasets[0].backgroundColor[i],
                                                hidden: false,
                                                index: i
                                            };
                                        });
                                    }
                                    return [];
                                }
                            }
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(20, 184, 166, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            displayColors: true,
                            callbacks: {
                                label: (context) => {
                                    return context.label + ': ₹' + context.parsed.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }

        // Revenue by Month Chart (Bar) - Shows filtered data based on dropdown
        if (revenueByMonthRef.current && filteredMonthlyData.labels.length > 0) {
            const ctx = revenueByMonthRef.current.getContext('2d');
            
            // Determine title based on selected filter
            let chartTitle = 'All Time';
            if (selectedMonth === '3') chartTitle = 'Last 3 Months';
            else if (selectedMonth === '6') chartTitle = 'Last 6 Months';
            else if (selectedMonth === '12') chartTitle = 'Last 12 Months';
            
            chartInstances.current.revenueByMonth = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: filteredMonthlyData.labels,
                    datasets: [{
                        label: 'Monthly Revenue',
                        data: filteredMonthlyData.data,
                        backgroundColor: 'rgba(20, 184, 166, 0.8)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: chartTitle,
                            font: { size: 12, weight: 'normal' },
                            color: '#6b7280',
                            padding: { bottom: 10 }
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(20, 184, 166, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: (context) => 'Revenue: ₹' + context.parsed.y.toLocaleString()
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => '₹' + value.toLocaleString()
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    };

    if (!orders || orders.length === 0) {
        return (
            <div className="analytics-empty-state">
                <i className="fas fa-chart-line"></i>
                <h3>No Analytics Data Available</h3>
                <p>Start receiving orders to see your sales analytics!</p>
            </div>
        );
    }

    return (
        <div className="seller-analytics">
            {/* Analytics Overview Cards */}
            <div className="analytics-overview">
                <div className="analytics-card">
                    <div className="analytics-card-icon revenue">
                        <i className="fas fa-rupee-sign"></i>
                    </div>
                    <div className="analytics-card-content">
                        <h3>Total Revenue</h3>
                        <p className="analytics-value">
                            ₹{parseFloat(statistics.totalRevenue || 0).toLocaleString()}
                            {growthMetrics.revenueGrowth !== 0 && (
                                <span className={`growth-indicator ${growthMetrics.revenueGrowth > 0 ? 'positive' : 'negative'}`}>
                                    <i className={`fas fa-arrow-${growthMetrics.revenueGrowth > 0 ? 'up' : 'down'}`}></i>
                                    {Math.abs(growthMetrics.revenueGrowth).toFixed(1)}%
                                </span>
                            )}
                        </p>
                        <span className="analytics-label">All time earnings</span>
                    </div>
                </div>
                <div className="analytics-card">
                    <div className="analytics-card-icon orders">
                        <i className="fas fa-shopping-cart"></i>
                    </div>
                    <div className="analytics-card-content">
                        <h3>Total Orders</h3>
                        <p className="analytics-value">
                            {statistics.totalOrders || orders.length}
                            {growthMetrics.orderGrowth !== 0 && (
                                <span className={`growth-indicator ${growthMetrics.orderGrowth > 0 ? 'positive' : 'negative'}`}>
                                    <i className={`fas fa-arrow-${growthMetrics.orderGrowth > 0 ? 'up' : 'down'}`}></i>
                                    {Math.abs(growthMetrics.orderGrowth).toFixed(1)}%
                                </span>
                            )}
                        </p>
                        <span className="analytics-label">All time orders</span>
                    </div>
                </div>
                <div className="analytics-card">
                    <div className="analytics-card-icon products">
                        <i className="fas fa-box"></i>
                    </div>
                    <div className="analytics-card-content">
                        <h3>Products Sold</h3>
                        <p className="analytics-value">{topProducts.reduce((sum, p) => sum + p.quantity, 0)}</p>
                        <span className="analytics-label">Total units sold</span>
                    </div>
                </div>
                <div className="analytics-card">
                    <div className="analytics-card-icon fulfilled">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="analytics-card-content">
                        <h3>Order Fulfillment</h3>
                        <p className="analytics-value">
                            {statistics.totalOrders > 0 
                                ? ((orders.filter(o => o.status === 'delivered' || o.status === 'completed').length / statistics.totalOrders) * 100).toFixed(1)
                                : 0}%
                        </p>
                        <span className="analytics-label">Success rate</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="analytics-charts-grid">
                {/* Sales Trend */}
                <div className="analytics-chart-card large">
                    <div className="chart-header">
                        <h3><i className="fas fa-chart-line"></i> Sales Trend</h3>
                        <span className="chart-subtitle">Complete 12-month revenue overview</span>
                    </div>
                    <div className="chart-container">
                        <canvas ref={salesTrendRef}></canvas>
                    </div>
                </div>

                {/* Revenue by Month */}
                <div className="analytics-chart-card large">
                    <div className="chart-header">
                        <div>
                            <h3><i className="fas fa-calendar-alt"></i> Monthly Revenue</h3>
                            <span className="chart-subtitle">Filtered revenue view with customizable time range</span>
                        </div>
                        <div className="date-filter">
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="month-filter-select"
                            >
                                <option value="all">All Time</option>
                                <option value="3">Last 3 Months</option>
                                <option value="6">Last 6 Months</option>
                                <option value="12">Last 12 Months</option>
                            </select>
                        </div>
                    </div>
                    <div className="chart-container">
                        <canvas ref={revenueByMonthRef}></canvas>
                    </div>
                </div>

                {/* Product Performance */}
                <div className="analytics-chart-card">
                    <div className="chart-header">
                        <h3><i className="fas fa-star"></i> Top 5 Products</h3>
                        <span className="chart-subtitle">Best selling products</span>
                    </div>
                    <div className="chart-container">
                        <canvas ref={productPerformanceRef}></canvas>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="analytics-chart-card">
                    <div className="chart-header">
                        <h3><i className="fas fa-pie-chart"></i> Category Revenue</h3>
                        <span className="chart-subtitle">Revenue by category</span>
                    </div>
                    <div className="chart-container">
                        <canvas ref={categoryDistributionRef}></canvas>
                    </div>
                </div>
            </div>
            {/* Order Status Breakdown */}
            <div className="order-status-section">
                <h3><i className="fas fa-tasks"></i> Order Status Overview</h3>
                <div className="status-cards-grid">
                    <div className="status-card">
                        <div className="status-card-header">
                            <div className="status-info">
                                <div className="status-icon pending">
                                    <i className="fas fa-clock"></i>
                                </div>
                                <span className="status-label">Pending</span>
                            </div>
                            <span className="status-percentage">
                                {orders.length > 0 ? ((orders.filter(o => o.status === 'pending').length / orders.length) * 100).toFixed(0) : 0}%
                            </span>
                        </div>
                        <p className="status-count">{orders.filter(o => o.status === 'pending').length}</p>
                    </div>
                    <div className="status-card">
                        <div className="status-card-header">
                            <div className="status-info">
                                <div className="status-icon processing">
                                    <i className="fas fa-spinner"></i>
                                </div>
                                <span className="status-label">Processing</span>
                            </div>
                            <span className="status-percentage">
                                {orders.length > 0 ? ((orders.filter(o => o.status === 'processing').length / orders.length) * 100).toFixed(0) : 0}%
                            </span>
                        </div>
                        <p className="status-count">{orders.filter(o => o.status === 'processing').length}</p>
                    </div>
                    <div className="status-card">
                        <div className="status-card-header">
                            <div className="status-info">
                                <div className="status-icon shipped">
                                    <i className="fas fa-shipping-fast"></i>
                                </div>
                                <span className="status-label">Shipped</span>
                            </div>
                            <span className="status-percentage">
                                {orders.length > 0 ? ((orders.filter(o => o.status === 'shipped').length / orders.length) * 100).toFixed(0) : 0}%
                            </span>
                        </div>
                        <p className="status-count">{orders.filter(o => o.status === 'shipped').length}</p>
                    </div>
                    <div className="status-card">
                        <div className="status-card-header">
                            <div className="status-info">
                                <div className="status-icon delivered">
                                    <i className="fas fa-check-circle"></i>
                                </div>
                                <span className="status-label">Delivered</span>
                            </div>
                            <span className="status-percentage">
                                {orders.length > 0 ? ((orders.filter(o => o.status === 'delivered' || o.status === 'completed').length / orders.length) * 100).toFixed(0) : 0}%
                            </span>
                        </div>
                        <p className="status-count">{orders.filter(o => o.status === 'delivered' || o.status === 'completed').length}</p>
                    </div>
                    <div className="status-card">
                        <div className="status-card-header">
                            <div className="status-info">
                                <div className="status-icon cancelled">
                                    <i className="fas fa-times-circle"></i>
                                </div>
                                <span className="status-label">Cancelled</span>
                            </div>
                            <span className="status-percentage">
                                {orders.length > 0 ? ((orders.filter(o => o.status === 'cancelled').length / orders.length) * 100).toFixed(0) : 0}%
                            </span>
                        </div>
                        <p className="status-count">{orders.filter(o => o.status === 'cancelled').length}</p>
                    </div>
                </div>
            </div>
            {/* Best Performing Products Table */}
            <div className="best-products-section">
                <div className="section-header">
                    <h3><i className="fas fa-trophy"></i> Best Performing Products</h3>
                    <span className="header-subtitle">Top 10 products by sales volume</span>
                </div>
                <div className="products-table-container">
                    <table className="products-performance-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Units Sold</th>
                                <th>Revenue</th>
                                <th>Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map((product, index) => {
                                const maxQuantity = topProducts[0]?.quantity || 1;
                                const performancePercentage = (product.quantity / maxQuantity) * 100;
                                
                                return (
                                    <tr key={product.id}>
                                        <td>
                                            <div className={`rank-badge rank-${index + 1}`}>
                                                {index + 1}
                                                {index === 0 && <i className="fas fa-crown"></i>}
                                            </div>
                                        </td>
                                        <td className="product-name-cell">{product.name}</td>
                                        <td>
                                            <span className="category-badge">{product.category}</span>
                                        </td>
                                        <td className="quantity-cell">{product.quantity}</td>
                                        <td className="revenue-cell">₹{product.revenue.toLocaleString()}</td>
                                        <td>
                                            <div className="performance-bar-container">
                                                <div 
                                                    className="performance-bar"
                                                    style={{ width: `${performancePercentage}%` }}
                                                ></div>
                                                <span className="performance-text">{performancePercentage.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Analysis Summary */}
            <div className="product-analysis-section">
                <h3><i className="fas fa-analytics"></i> Product Analysis Summary</h3>
                <div className="analysis-cards-grid">
                    <div className="analysis-card">
                        <div className="analysis-icon">
                            <i className="fas fa-fire"></i>
                        </div>
                        <div className="analysis-content">
                            <h4>Most Popular</h4>
                            <p className="analysis-product-name">{topProducts[0]?.name || 'N/A'}</p>
                            <span className="analysis-stat">{topProducts[0]?.quantity || 0} units sold</span>
                        </div>
                    </div>
                    <div className="analysis-card">
                        <div className="analysis-icon">
                            <i className="fas fa-dollar-sign"></i>
                        </div>
                        <div className="analysis-content">
                            <h4>Highest Revenue</h4>
                            <p className="analysis-product-name">
                                {topProducts.reduce((max, p) => p.revenue > max.revenue ? p : max, topProducts[0] || {}).name || 'N/A'}
                            </p>
                            <span className="analysis-stat">
                                ₹{(topProducts.reduce((max, p) => p.revenue > max.revenue ? p : max, topProducts[0] || {}).revenue || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div className="analysis-card">
                        <div className="analysis-icon">
                            <i className="fas fa-layer-group"></i>
                        </div>
                        <div className="analysis-content">
                            <h4>Top Category</h4>
                            <p className="analysis-product-name">
                                {Object.keys(categoryStats).reduce((a, b) => categoryStats[a] > categoryStats[b] ? a : b, Object.keys(categoryStats)[0] || 'N/A')}
                            </p>
                            <span className="analysis-stat">
                                ₹{(Math.max(...Object.values(categoryStats)) || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div className="analysis-card">
                        <div className="analysis-icon">
                            <i className="fas fa-percentage"></i>
                        </div>
                        <div className="analysis-content">
                            <h4>Order Fulfillment</h4>
                            <p className="analysis-product-name">
                                {orders.filter(o => o.status === 'delivered' || o.status === 'completed').length} / {orders.length}
                            </p>
                            <span className="analysis-stat">
                                {orders.length > 0 
                                    ? ((orders.filter(o => o.status === 'delivered' || o.status === 'completed').length / orders.length) * 100).toFixed(1) 
                                    : 0}% Success Rate
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerAnalytics;
