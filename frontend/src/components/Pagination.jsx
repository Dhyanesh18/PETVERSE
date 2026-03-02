import React from 'react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="pagination-container">
            <div className="pagination">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <i className="fas fa-chevron-left"></i>
                    <span>Previous</span>
                </button>

                <div className="pagination-numbers">
                    {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                        ) : (
                            <button
                                key={page}
                                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </button>
                        )
                    ))}
                </div>

                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <span>Next</span>
                    <i className="fas fa-chevron-right"></i>
                </button>
            </div>
            <div className="pagination-info">
                Page {currentPage} of {totalPages}
            </div>
        </div>
    );
};

export default Pagination;
