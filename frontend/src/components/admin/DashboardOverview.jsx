import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './DashboardComponents.css';

const DashboardOverview = ({ data }) => {
    const userGrowthRef = useRef(null);
    const userDistributionRef = useRef(null);
    const productCategoriesRef = useRef(null);
    const revenueRef = useRef(null);
    
    const chartInstances = useRef({});

    useEffect(() => {
        if (!data) return;

        // Destroy existing charts before creating new ones
        Object.values(chartInstances.current).forEach(chart => {
            if (chart) chart.destroy();
        });

        // User Growth Chart
        if (userGrowthRef.current && data.userGrowthData) {
            const ctx = userGrowthRef.current.getContext('2d');
            chartInstances.current.userGrowth = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.userGrowthData.labels,
                    datasets: [{
                        label: 'User Growth',
                        data: data.userGrowthData.data,
                        borderColor: '#14b8a6',
                        backgroundColor: 'rgba(20, 184, 166, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#14b8a6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#14b8a6',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // User Distribution Chart
        if (userDistributionRef.current && data.userDistributionData) {
            const ctx = userDistributionRef.current.getContext('2d');
            chartInstances.current.userDistribution = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.userDistributionData.labels,
                    datasets: [{
                        data: data.userDistributionData.data,
                        backgroundColor: [
                            '#14b8a6',
                            '#f59e0b',
                            '#8b5cf6',
                            '#ec4899'
                        ],
                        borderWidth: 0
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
                                font: { size: 12 }
                            }
                        }
                    }
                }
            });
        }

        // Product Categories Chart
        if (productCategoriesRef.current && data.productCategoriesData) {
            const ctx = productCategoriesRef.current.getContext('2d');
            chartInstances.current.productCategories = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.productCategoriesData.labels,
                    datasets: [{
                        label: 'Products',
                        data: data.productCategoriesData.data,
                        backgroundColor: 'rgba(20, 184, 166, 0.8)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // Revenue Chart
        if (revenueRef.current && data.revenueData) {
            const ctx = revenueRef.current.getContext('2d');
            chartInstances.current.revenue = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.revenueData.labels,
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: data.revenueData.data,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // Cleanup function
        return () => {
            Object.values(chartInstances.current).forEach(chart => {
                if (chart) chart.destroy();
            });
        };
    }, [data]);

    if (!data) return <div>Loading...</div>;

    const stats = [
        { icon: 'check-circle', label: 'Approved', value: data.stats?.approved || 0, color: 'green' },
        { icon: 'clock', label: 'Pending', value: data.stats?.pending || 0, color: 'orange' },
        { icon: 'store', label: 'Sellers', value: data.stats?.sellers || 0, color: 'purple' },
        { icon: 'users', label: 'Total Users', value: data.stats?.totalUsers || 0, color: 'blue' },
        { icon: 'box', label: 'Products', value: data.stats?.totalProducts || 0, color: 'teal' },
        { icon: 'paw', label: 'Pets Listed', value: data.stats?.petsListed || 0, color: 'pink' }
    ];

    return (
        <div className="dashboard-overview">
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className={`stat-card ${stat.color}`}>
                        <div className="stat-icon">
                            <i className={`fas fa-${stat.icon}`}></i>
                        </div>
                        <div className="stat-content">
                            <h3>{stat.label}</h3>
                            <p className="stat-value">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>User Growth</h3>
                    <div className="chart-container">
                        <canvas ref={userGrowthRef}></canvas>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>User Distribution</h3>
                    <div className="chart-container">
                        <canvas ref={userDistributionRef}></canvas>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Product Categories</h3>
                    <div className="chart-container">
                        <canvas ref={productCategoriesRef}></canvas>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Monthly Revenue</h3>
                    <div className="chart-container">
                        <canvas ref={revenueRef}></canvas>
                    </div>
                </div>
            </div>

            <div className="platform-summary">
                <h2>Platform Summary</h2>
                <div className="summary-grid">
                    <div className="summary-item">
                        <i className="fas fa-users"></i>
                        <div>
                            <p className="summary-label">Total Users</p>
                            <p className="summary-value">{data.platformSummary?.totalUsers || 0}</p>
                        </div>
                    </div>
                    <div className="summary-item">
                        <i className="fas fa-store"></i>
                        <div>
                            <p className="summary-label">Active Sellers</p>
                            <p className="summary-value">{data.platformSummary?.activeSellers || 0}</p>
                        </div>
                    </div>
                    <div className="summary-item">
                        <i className="fas fa-concierge-bell"></i>
                        <div>
                            <p className="summary-label">Service Providers</p>
                            <p className="summary-value">{data.platformSummary?.serviceProviders || 0}</p>
                        </div>
                    </div>
                    <div className="summary-item">
                        <i className="fas fa-box"></i>
                        <div>
                            <p className="summary-label">Total Products</p>
                            <p className="summary-value">{data.platformSummary?.totalProducts || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
