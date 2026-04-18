import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaCamera, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import api from '../services/api';

const ClaimReview = () => {
    const { id } = useParams(); // Lost pet ID
    const navigate = useNavigate();
    const [lostPet, setLostPet] = useState(null);
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [reviewAction, setReviewAction] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [ownerNotes, setOwnerNotes] = useState('');

    useEffect(() => {
        fetchClaimsAndPet();
    }, [id]);

    const fetchClaimsAndPet = async () => {
        try {
            setLoading(true);
            const [petResponse, claimsResponse] = await Promise.all([
                api.get(`/lost-pets/${id}`),
                api.get(`/lost-pets/${id}/claims`)
            ]);

            setLostPet(petResponse.data.data);
            setClaims(claimsResponse.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch claims');
        } finally {
            setLoading(false);
        }
    };

    const getClaimImageUrl = (claimId, index) => {
        return `/api/lost-pets/claims/image/${claimId}/${index}`;
    };

    const handleReviewSubmit = async () => {
        if (!selectedClaim || !reviewAction) return;

        if (reviewAction === 'reject' && !rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await api.post(`/lost-pets/claims/${selectedClaim._id}/review`, {
                action: reviewAction,
                rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
                ownerNotes: reviewAction === 'approve' ? ownerNotes : undefined
            });

            alert(
                reviewAction === 'approve'
                    ? 'Claim approved! Your contact information has been shared with the finder.'
                    : 'Claim rejected.'
            );

            setSelectedClaim(null);
            setReviewAction('');
            setRejectionReason('');
            setOwnerNotes('');
            fetchClaimsAndPet();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit review');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            expired: 'bg-gray-100 text-gray-800'
        };
        return badges[status] || badges.pending;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-xl text-gray-700 font-semibold">Loading claims...</p>
                </div>
            </div>
        );
    }

    if (error || !lostPet) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="text-center bg-white p-8 rounded-lg shadow-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600 mb-4">{error || 'Failed to load claims'}</p>
                    <button
                        onClick={() => navigate('/lost-found')}
                        className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        Back to Lost & Found
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/lost-found/${id}`)}
                        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-4 font-semibold"
                    >
                        <FaArrowLeft />
                        Back to Pet Details
                    </button>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Review Found Claims for {lostPet.petName}
                        </h1>
                        <p className="text-gray-600">
                            {lostPet.petType} • {lostPet.breed} • {lostPet.color}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Total Claims: {claims.length} | Pending: {claims.filter(c => c.status === 'pending').length}
                        </p>
                    </div>
                </div>

                {/* Claims List */}
                {claims.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="text-gray-300 text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Claims Yet</h3>
                        <p className="text-gray-600">You haven't received any claims for this pet yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {claims.map((claim) => (
                            <div
                                key={claim._id}
                                className={`bg-white rounded-lg shadow-md overflow-hidden ${
                                    claim.status === 'pending' ? 'border-2 border-yellow-400' : ''
                                }`}
                            >
                                <div className="p-6">
                                    {/* Claim Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">
                                                Claim by {claim.claimerName}
                                            </h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                <FaClock />
                                                Submitted: {formatDate(claim.createdAt)}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(claim.status)}`}>
                                            {claim.status.toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Claim Images */}
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                            <FaCamera className="text-teal-600" />
                                            Submitted Images
                                        </h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {claim.images.map((_, index) => (
                                                <img
                                                    key={index}
                                                    src={getClaimImageUrl(claim._id, index)}
                                                    alt={`Found pet ${index + 1}`}
                                                    className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(getClaimImageUrl(claim._id, index), '_blank')}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Verification Questions & Answers */}
                                    {claim.verificationQuestions && claim.verificationQuestions.length > 0 && (
                                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-amber-900 mb-3">
                                                🔐 Verification Answers
                                            </h4>
                                            {claim.verificationQuestions.map((vq, index) => (
                                                <div key={index} className="mb-3 last:mb-0">
                                                    <p className="text-sm font-medium text-gray-700">Q: {vq.question}</p>
                                                    <p className="text-sm text-gray-900 ml-4 flex items-center gap-2">
                                                        <span className="font-semibold">A:</span> {vq.answer}
                                                        {vq.isCorrect !== null && (
                                                            <span className={vq.isCorrect ? 'text-green-600' : 'text-red-600'}>
                                                                {vq.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Found Location */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-teal-600" />
                                                Found Location
                                            </h4>
                                            <p className="text-sm text-gray-700">{claim.foundLocation.address}</p>
                                            <p className="text-sm text-gray-700">
                                                {claim.foundLocation.city}, {claim.foundLocation.state}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                                                <FaCalendarAlt />
                                                Found on: {formatDate(claim.foundDate)}
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                                <FaUser className="text-teal-600" />
                                                Claimer Contact
                                            </h4>
                                            <p className="text-sm text-gray-700 flex items-center gap-2">
                                                <FaPhone className="text-cyan-500" />
                                                {claim.claimerPhone}
                                            </p>
                                            <p className="text-sm text-gray-700 flex items-center gap-2 mt-1">
                                                <FaEnvelope className="text-cyan-500" />
                                                {claim.claimerEmail}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-800 mb-2">Additional Details</h4>
                                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{claim.description}</p>
                                    </div>

                                    {/* Review Actions (Only for pending claims) */}
                                    {claim.status === 'pending' && (
                                        <div className="border-t pt-4 mt-4">
                                            {selectedClaim?._id === claim._id ? (
                                                <div className="space-y-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setReviewAction('approve')}
                                                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                                                                reviewAction === 'approve'
                                                                    ? 'bg-green-600 text-white'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            }`}
                                                        >
                                                            <FaCheckCircle />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => setReviewAction('reject')}
                                                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                                                                reviewAction === 'reject'
                                                                    ? 'bg-red-600 text-white'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            }`}
                                                        >
                                                            <FaTimesCircle />
                                                            Reject
                                                        </button>
                                                    </div>

                                                    {reviewAction === 'approve' && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Notes for the finder (optional)
                                                            </label>
                                                            <textarea
                                                                value={ownerNotes}
                                                                onChange={(e) => setOwnerNotes(e.target.value)}
                                                                rows="2"
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                                                placeholder="E.g., Thank you so much! I'll come by tomorrow..."
                                                            />
                                                        </div>
                                                    )}

                                                    {reviewAction === 'reject' && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Reason for rejection
                                                            </label>
                                                            <textarea
                                                                value={rejectionReason}
                                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                                rows="2"
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                                                placeholder="E.g., This doesn't look like my pet..."
                                                                required
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedClaim(null);
                                                                setReviewAction('');
                                                                setRejectionReason('');
                                                                setOwnerNotes('');
                                                            }}
                                                            className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleReviewSubmit}
                                                            disabled={!reviewAction}
                                                            className="flex-1 py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Submit Review
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedClaim(claim)}
                                                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                                                >
                                                    Review This Claim
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Reviewed Status */}
                                    {claim.status === 'approved' && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                                            <p className="text-green-800 font-semibold flex items-center gap-2">
                                                <FaCheckCircle />
                                                Claim Approved - Contact information shared
                                            </p>
                                            {claim.ownerNotes && (
                                                <p className="text-sm text-green-700 mt-2">
                                                    Your note: "{claim.ownerNotes}"
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {claim.status === 'rejected' && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                                            <p className="text-red-800 font-semibold flex items-center gap-2">
                                                <FaTimesCircle />
                                                Claim Rejected
                                            </p>
                                            {claim.rejectionReason && (
                                                <p className="text-sm text-red-700 mt-2">
                                                    Reason: "{claim.rejectionReason}"
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClaimReview;
