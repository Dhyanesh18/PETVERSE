// Get pending approvals
exports.getApprovals = async (req, res) => {
    const pendingUsers = await User.find({
        isApproved: false,
        role: { $in: ['seller', 'service_provider'] }
    }).populate({
        path: 'documents',
        match: { status: 'pending' }
    });
    
    res.render('admin/approvals', {
        users: pendingUsers.map(user => ({
        _id: user._id,
        email: user.email,
        role: user.role,
        requestedAt: user.approvalRequestedAt,
        documents: user.documents
        }))
    });
};

  // Approve user
exports.approveUser = async (req, res) => {
    const { userId } = req.params;
    
    await User.findByIdAndUpdate(userId, {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: req.user._id
    });
    
    await Document.updateMany(
        { userId },
        { status: 'verified', reviewedBy: req.user._id }
    );
    
    res.json({ success: true });
};