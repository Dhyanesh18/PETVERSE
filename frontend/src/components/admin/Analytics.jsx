import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Chart from 'chart.js/auto';
import { fetchAnalytics } from '../../redux/slices/adminSlice';
import './Analytics.css';

const Analytics = () => {
    const dispatch = useDispatch();
    const { analyticsData, analyticsLoading, analyticsError } = useSelector(state => state.admin);
    
    // Chart refs
    const serviceRevenueRef = useRef(null);
    const sellerRevenueRef = useRef(null);
    const categoryPerformanceRef = useRef(null);
    const paymentMethodRef = useRef(null);
    const orderStatusRef = useRef(null);
    const serviceTypeRef = useRef(null);
    
    const chartInstances = useRef({});

    useEffect(() => {
        dispatch(fetchAnalytics());
    }, [dispatch]);

    useEffect(() => {
        if (!analyticsData?.data) return;

        // Store the current chart instances for cleanup
        const currentCharts = chartInstances.current;

        // Destroy existing charts
        Object.values(currentCharts).forEach(chart => {
            if (chart) chart.destroy();
        });

        const data = analyticsData.data;

        // Service Revenue by Month Chart
        if (serviceRevenueRef.current && data.serviceAnalytics?.revenueByMonth) {
            const ctx = serviceRevenueRef.current.getContext('2d');
            chartInstances.current.serviceRevenue = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.serviceAnalytics.revenueByMonth.labels,
                    datasets: [{
                        label: 'Service Revenue (₹)',
                        data: data.serviceAnalytics.revenueByMonth.data,
                        borderColor: '#14b8a6',
                        backgroundColor: 'rgba(20, 184, 166, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#14b8a6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(20, 184, 166, 0.9)',
                            padding: 12
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => '₹' + value.toLocaleString()
                            }
                        }
                    }
                }
            });
        }

        // Seller Revenue by Month Chart
        if (sellerRevenueRef.current && data.sellerAnalytics?.revenueByMonth) {
            const ctx = sellerRevenueRef.current.getContext('2d');
            chartInstances.current.sellerRevenue = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.sellerAnalytics.revenueByMonth.labels,
                    datasets: [{
                        label: 'Seller Revenue (₹)',
                        data: data.sellerAnalytics.revenueByMonth.data,
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
                            ticks: {
                                callback: value => '₹' + value.toLocaleString()
                            }
                        }
                    }
                }
            });
        }

        // Category Performance Chart
        if (categoryPerformanceRef.current && data.productAnalytics?.categoryPerformance) {
            const categories = Object.keys(data.productAnalytics.categoryPerformance);
            const revenues = categories.map(cat => data.productAnalytics.categoryPerformance[cat].revenue);
            
            const ctx = categoryPerformanceRef.current.getContext('2d');
            chartInstances.current.categoryPerformance = new Chart(ctx, {
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
                            '#155e75'
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
                            labels: { padding: 15, font: { size: 11 } }
                        },
                        tooltip: {
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

        // Payment Method Distribution
        if (paymentMethodRef.current && data.platformMetrics?.paymentMethodDistribution) {
            const methods = Object.keys(data.platformMetrics.paymentMethodDistribution);
            const counts = Object.values(data.platformMetrics.paymentMethodDistribution);
            
            const ctx = paymentMethodRef.current.getContext('2d');
            chartInstances.current.paymentMethod = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: methods.map(m => m.toUpperCase()),
                    datasets: [{
                        data: counts,
                        backgroundColor: [
                            '#14b8a6',
                            '#06b6d4',
                            '#0891b2',
                            '#0e7490',
                            '#155e75'
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
                            labels: { padding: 10, font: { size: 11 } }
                        }
                    }
                }
            });
        }

        // Order Status Distribution
        if (orderStatusRef.current && data.platformMetrics?.orderStatusDistribution) {
            const statuses = Object.keys(data.platformMetrics.orderStatusDistribution);
            const counts = Object.values(data.platformMetrics.orderStatusDistribution);
            
            const ctx = orderStatusRef.current.getContext('2d');
            chartInstances.current.orderStatus = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: statuses.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                    datasets: [{
                        label: 'Orders',
                        data: counts,
                        backgroundColor: 'rgba(20, 184, 166, 0.8)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // Service Type Breakdown
        if (serviceTypeRef.current && data.serviceAnalytics?.serviceTypeBreakdown) {
            const types = Object.keys(data.serviceAnalytics.serviceTypeBreakdown);
            const counts = Object.values(data.serviceAnalytics.serviceTypeBreakdown);
            
            const ctx = serviceTypeRef.current.getContext('2d');
            chartInstances.current.serviceType = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: types.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
                    datasets: [{
                        label: 'Services',
                        data: counts,
                        backgroundColor: 'rgba(20, 184, 166, 0.8)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true }
                    }
                }
            });
        }

        return () => {
            // Use the stored reference for cleanup
            Object.values(currentCharts).forEach(chart => {
                if (chart) chart.destroy();
            });
        };
    }, [analyticsData]);

    if (analyticsLoading) {
        return (
            <div className="analytics-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (analyticsError) {
        return (
            <div className="analytics-error">
                <i className="fas fa-exclamation-triangle"></i>
                <p>Error: {analyticsError}</p>
                <button onClick={() => dispatch(fetchAnalytics())} className="btn-retry">
                    <i className="fas fa-redo"></i> Retry
                </button>
            </div>
        );
    }

    if (!analyticsData?.data) {
        return <div className="analytics-loading">No analytics data available</div>;
    }

    const data = analyticsData.data;

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <h1>Analytics Dashboard</h1>
                <button 
                    onClick={() => dispatch(fetchAnalytics())} 
                    className="btn-refresh"
                    title="Refresh analytics data"
                >
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            {/* Platform Overview */}
            <section className="analytics-section">
                <h2 className="section-title">
                    <i className="fas fa-chart-line"></i> Platform Overview
                </h2>
                <div className="metrics-grid">
                    <div className="metric-card teal">
                        <div className="metric-icon">
                            <i className="fas fa-rupee-sign"></i>
                        </div>
                        <div className="metric-content">
                            <h3>Total Revenue</h3>
                            <p className="metric-value">₹{data.platformMetrics?.totalRevenue?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                    <div className="metric-card cyan">
                        <div className="metric-icon">
                            <i className="fas fa-percentage"></i>
                        </div>
                        <div className="metric-content">
                            <h3>Commissions</h3>
                            <p className="metric-value">₹{data.platformMetrics?.totalCommissions?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                    <div className="metric-card cyan-dark">
                        <div className="metric-icon">
                            <i className="fas fa-exchange-alt"></i>
                        </div>
                        <div className="metric-content">
                            <h3>Transactions</h3>
                            <p className="metric-value">{data.platformMetrics?.totalTransactions?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Analytics */}
            <section className="analytics-section">
                <h2 className="section-title">
                    <i className="fas fa-concierge-bell"></i> Services Analytics
                </h2>
                <div className="metrics-grid">
                    <div className="metric-card teal">
                        <div className="metric-icon"><i className="fas fa-rupee-sign"></i></div>
                        <div className="metric-content">
                            <h3>Service Revenue</h3>
                            <p className="metric-value">₹{data.serviceAnalytics?.totalRevenue?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                    <div className="metric-card cyan">
                        <div className="metric-icon"><i className="fas fa-calendar-check"></i></div>
                        <div className="metric-content">
                            <h3>Total Bookings</h3>
                            <p className="metric-value">{data.serviceAnalytics?.totalBookings || 0}</p>
                        </div>
                    </div>
                    <div className="metric-card teal-dark">
                        <div className="metric-icon"><i className="fas fa-hands-helping"></i></div>
                        <div className="metric-content">
                            <h3>Active Services</h3>
                            <p className="metric-value">{data.serviceAnalytics?.totalServices || 0}</p>
                        </div>
                    </div>
                </div>
                
                <div className="charts-row">
                    <div className="chart-card">
                        <h3>Service Revenue Trend</h3>
                        <div className="chart-container">
                            <canvas ref={serviceRevenueRef}></canvas>
                        </div>
                    </div>
                    <div className="chart-card">
                        <h3>Service Types</h3>
                        <div className="chart-container">
                            <canvas ref={serviceTypeRef}></canvas>
                        </div>
                    </div>
                </div>

                {/* Top Service Providers */}
                {data.serviceAnalytics?.topServiceProviders?.length > 0 && (
                    <div className="table-card">
                        <h3>Top Service Providers</h3>
                        <div className="table-responsive">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Provider</th>
                                        <th>Email</th>
                                        <th>Revenue</th>
                                        <th>Bookings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.serviceAnalytics.topServiceProviders.map((provider, index) => (
                                        <tr key={provider.id}>
                                            <td className="rank-cell">#{index + 1}</td>
                                            <td className="name-cell">{provider.name}</td>
                                            <td>{provider.email}</td>
                                            <td className="revenue-cell">₹{provider.revenue?.toLocaleString() || 0}</td>
                                            <td>{provider.bookingsCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {/* Seller Analytics */}
            <section className="analytics-section">
                <h2 className="section-title">
                    <i className="fas fa-store"></i> Seller Analytics
                </h2>
                <div className="metrics-grid">
                    <div className="metric-card teal">
                        <div className="metric-icon"><i className="fas fa-rupee-sign"></i></div>
                        <div className="metric-content">
                            <h3>Seller Revenue</h3>
                            <p className="metric-value">₹{data.sellerAnalytics?.totalRevenue?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                    <div className="metric-card cyan">
                        <div className="metric-icon"><i className="fas fa-shopping-cart"></i></div>
                        <div className="metric-content">
                            <h3>Total Orders</h3>
                            <p className="metric-value">{data.sellerAnalytics?.totalOrders || 0}</p>
                        </div>
                    </div>
                    <div className="metric-card teal-dark">
                        <div className="metric-icon"><i className="fas fa-chart-line"></i></div>
                        <div className="metric-content">
                            <h3>Avg Order Value</h3>
                            <p className="metric-value">₹{parseFloat(data.sellerAnalytics?.avgOrderValue || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="chart-card full-width">
                    <h3>Seller Revenue Trend</h3>
                    <div className="chart-container">
                        <canvas ref={sellerRevenueRef}></canvas>
                    </div>
                </div>

                {/* Top Sellers */}
                {data.sellerAnalytics?.topSellers?.length > 0 && (
                    <div className="table-card">
                        <h3>Top Sellers</h3>
                        <div className="table-responsive">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Seller</th>
                                        <th>Email</th>
                                        <th>Revenue</th>
                                        <th>Orders</th>
                                        <th>Avg Order</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.sellerAnalytics.topSellers.map((seller, index) => (
                                        <tr key={seller.id}>
                                            <td className="rank-cell">#{index + 1}</td>
                                            <td className="name-cell">{seller.name}</td>
                                            <td>{seller.email}</td>
                                            <td className="revenue-cell">₹{seller.revenue?.toLocaleString() || 0}</td>
                                            <td>{seller.orderCount}</td>
                                            <td>₹{parseFloat(seller.avgOrderValue).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {/* Product Analytics */}
            <section className="analytics-section">
                <h2 className="section-title">
                    <i className="fas fa-box"></i> Product Analytics
                </h2>
                
                <div className="charts-row">
                    <div className="chart-card">
                        <h3>Category Performance</h3>
                        <div className="chart-container">
                            <canvas ref={categoryPerformanceRef}></canvas>
                        </div>
                    </div>
                    <div className="chart-card">
                        <h3>Order Status</h3>
                        <div className="chart-container">
                            <canvas ref={orderStatusRef}></canvas>
                        </div>
                    </div>
                </div>

                {/* Best Products */}
                {data.productAnalytics?.bestProducts?.length > 0 && (
                    <div className="table-card">
                        <h3>Best Performing Products</h3>
                        <div className="table-responsive">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Brand</th>
                                        <th>Revenue</th>
                                        <th>Units Sold</th>
                                        <th>Rating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.productAnalytics.bestProducts.map((product, index) => (
                                        <tr key={product.id}>
                                            <td className="rank-cell">#{index + 1}</td>
                                            <td className="name-cell">{product.name}</td>
                                            <td>{product.category}</td>
                                            <td>{product.brand}</td>
                                            <td className="revenue-cell">₹{product.totalRevenue?.toLocaleString() || 0}</td>
                                            <td>{product.totalQuantity}</td>
                                            <td>
                                                <span className="rating">
                                                    <i className="fas fa-star"></i> {product.avgRating?.toFixed(1) || 'N/A'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {/* Customer Analytics */}
            <section className="analytics-section">
                <h2 className="section-title">
                    <i className="fas fa-users"></i> Customer Analytics
                </h2>
                <div className="metrics-grid">
                    <div className="metric-card teal">
                        <div className="metric-icon"><i className="fas fa-users"></i></div>
                        <div className="metric-content">
                            <h3>Total Customers</h3>
                            <p className="metric-value">{data.customerAnalytics?.totalCustomers || 0}</p>
                        </div>
                    </div>
                    <div className="metric-card cyan">
                        <div className="metric-icon"><i className="fas fa-chart-line"></i></div>
                        <div className="metric-content">
                            <h3>Avg Customer Value</h3>
                            <p className="metric-value">₹{parseFloat(data.customerAnalytics?.avgCustomerValue || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="chart-card">
                        <h3>Payment Methods</h3>
                        <div className="chart-container">
                            <canvas ref={paymentMethodRef}></canvas>
                        </div>
                    </div>
                </div>

                {/* Top Customers */}
                {data.customerAnalytics?.topCustomers?.length > 0 && (
                    <div className="table-card">
                        <h3>Top Customers</h3>
                        <div className="table-responsive">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Customer</th>
                                        <th>Email</th>
                                        <th>Total Spent</th>
                                        <th>Orders</th>
                                        <th>Avg Order</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.customerAnalytics.topCustomers.map((customer, index) => (
                                        <tr key={customer.id}>
                                            <td className="rank-cell">#{index + 1}</td>
                                            <td className="name-cell">{customer.name}</td>
                                            <td>{customer.email}</td>
                                            <td className="revenue-cell">₹{customer.totalSpent?.toLocaleString() || 0}</td>
                                            <td>{customer.orderCount}</td>
                                            <td>₹{parseFloat(customer.avgOrderValue).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {/* Event Analytics */}
            {data.eventAnalytics && (
                <section className="analytics-section">
                    <h2 className="section-title">
                        <i className="fas fa-calendar-alt"></i> Event Analytics
                    </h2>
                    <div className="metrics-grid">
                        <div className="metric-card teal">
                            <div className="metric-icon"><i className="fas fa-rupee-sign"></i></div>
                            <div className="metric-content">
                                <h3>Event Revenue</h3>
                                <p className="metric-value">₹{data.eventAnalytics?.totalRevenue?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                        <div className="metric-card cyan">
                            <div className="metric-icon"><i className="fas fa-calendar"></i></div>
                            <div className="metric-content">
                                <h3>Total Events</h3>
                                <p className="metric-value">{data.eventAnalytics?.totalEvents || 0}</p>
                            </div>
                        </div>
                        <div className="metric-card teal-dark">
                            <div className="metric-icon"><i className="fas fa-users"></i></div>
                            <div className="metric-content">
                                <h3>Total Attendees</h3>
                                <p className="metric-value">{data.eventAnalytics?.totalAttendees || 0}</p>
                            </div>
                        </div>
                        <div className="metric-card cyan-dark">
                            <div className="metric-icon"><i className="fas fa-clock"></i></div>
                            <div className="metric-content">
                                <h3>Upcoming Events</h3>
                                <p className="metric-value">{data.eventAnalytics?.upcomingEvents || 0}</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Analytics;
