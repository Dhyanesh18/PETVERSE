{/* Reviews List */}
                    {reviews && reviews.length > 0 ? (
                        <div className="space-y-4">
                            {(() => {
                                const startIndex = (currentReviewPage - 1) * reviewsPerPage;
                                const endIndex = startIndex + reviewsPerPage;
                                const paginatedReviews = reviews.slice(startIndex, endIndex);
                                return paginatedReviews.map((review) => (
                                    <div key={review._id} className="bg-white border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                    {review.user.fullName?.charAt(0) || review.user.username?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">
                                                        {review.user.fullName || review.user.username}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={star}
                                                                    className={`w-4 h-4 ${
                                                                        star <= review.rating
                                                                            ? 'text-yellow-400 fill-yellow-400'
                                                                            : 'text-gray-300'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm text-gray-500">
                                                            {review.timeAgo || new Date(review.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                    </div>
                                ));
                            })()}
                            
                            {/* Pagination */}
                            {reviews.length > reviewsPerPage && (
                                <div className="flex justify-center mt-6 space-x-2">
                                    {Array.from({ length: Math.ceil(reviews.length / reviewsPerPage) }, (_, index) => (
                                        <button
                                            key={index + 1}
                                            onClick={() => setCurrentReviewPage(index + 1)}
                                            className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                                currentReviewPage === index + 1
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>