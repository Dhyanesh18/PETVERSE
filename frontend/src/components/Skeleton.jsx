// Reusable skeleton primitives — all shimmer via Tailwind animate-pulse

/** Single shimmer bar */
export const SkeletonLine = ({ className = '' }) => (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

/** Shimmer block (box / card body / image placeholder) */
export const SkeletonBlock = ({ className = '' }) => (
    <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
);

/** Circle avatar */
export const SkeletonCircle = ({ className = '' }) => (
    <div className={`bg-gray-200 rounded-full animate-pulse ${className}`} />
);

// ─────────────────────────────────────────────
// STAT CARD skeleton
// ─────────────────────────────────────────────
export const SkeletonStatCard = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <SkeletonCircle className="w-10 h-10 mb-3" />
        <SkeletonLine className="h-8 w-24 mb-1" />
        <SkeletonLine className="h-4 w-32" />
    </div>
);

// ─────────────────────────────────────────────
// TABLE ROW skeleton
// ─────────────────────────────────────────────
export const SkeletonTableRow = ({ cols = 5 }) => (
    <tr className="border-b border-gray-100">
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="p-4">
                <SkeletonLine className="h-4 w-full" />
            </td>
        ))}
    </tr>
);

// ─────────────────────────────────────────────
// CARD skeleton (for event / product cards)
// ─────────────────────────────────────────────
export const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <SkeletonBlock className="w-full h-48 rounded-none" />
        <div className="p-4 space-y-3">
            <SkeletonLine className="h-5 w-3/4" />
            <SkeletonLine className="h-4 w-1/2" />
            <div className="flex gap-2 pt-1">
                <SkeletonLine className="h-4 w-16" />
                <SkeletonLine className="h-4 w-16" />
            </div>
            <SkeletonLine className="h-9 w-full mt-2" />
        </div>
    </div>
);

// ─────────────────────────────────────────────
// PROFILE ROW skeleton
// ─────────────────────────────────────────────
export const SkeletonProfileRow = () => (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <SkeletonCircle className="w-10 h-10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <SkeletonLine className="h-3 w-20" />
            <SkeletonLine className="h-4 w-40" />
        </div>
    </div>
);

// ─────────────────────────────────────────────
// CART ITEM skeleton
// ─────────────────────────────────────────────
export const SkeletonCartItem = () => (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <SkeletonBlock className="w-20 h-20 flex-shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
            <SkeletonLine className="h-5 w-48" />
            <SkeletonLine className="h-4 w-24" />
            <div className="flex gap-3 pt-1">
                <SkeletonLine className="h-8 w-24" />
                <SkeletonLine className="h-8 w-16" />
            </div>
        </div>
        <SkeletonLine className="h-6 w-16 flex-shrink-0" />
    </div>
);

// ─────────────────────────────────────────────
// TRANSACTION ROW skeleton
// ─────────────────────────────────────────────
export const SkeletonTransaction = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
        <div className="flex items-center gap-4">
            <SkeletonCircle className="w-10 h-10" />
            <div className="space-y-2">
                <SkeletonLine className="h-4 w-40" />
                <SkeletonLine className="h-3 w-24" />
            </div>
        </div>
        <SkeletonLine className="h-5 w-20" />
    </div>
);

// ─────────────────────────────────────────────
// ORDER ITEM skeleton
// ─────────────────────────────────────────────
export const SkeletonOrderItem = () => (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0">
        <SkeletonBlock className="w-16 h-16 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <SkeletonLine className="h-4 w-48" />
            <SkeletonLine className="h-3 w-28" />
        </div>
        <SkeletonLine className="h-5 w-20 flex-shrink-0" />
    </div>
);

// ─────────────────────────────────────────────
// SERVICE PROVIDER DASHBOARD skeleton
// ─────────────────────────────────────────────
export const ServiceProviderDashboardSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
        <div className="flex">
            {/* Sidebar skeleton */}
            <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-white shadow-lg p-4 space-y-3 z-30">
                <div className="pb-4 border-b border-gray-200 space-y-1">
                    <SkeletonLine className="h-5 w-28" />
                    <SkeletonLine className="h-3 w-20" />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                        <SkeletonCircle className="w-7 h-7" />
                        <div className="space-y-1 flex-1">
                            <SkeletonLine className="h-3 w-20" />
                            <SkeletonLine className="h-2 w-28" />
                        </div>
                    </div>
                ))}
            </aside>

            {/* Main content skeleton */}
            <main className="ml-64 flex-1 p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex justify-between items-center">
                        <SkeletonLine className="h-8 w-64" />
                        <SkeletonLine className="h-9 w-32 rounded-full" />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
                    </div>

                    {/* Profile section */}
                    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 space-y-4">
                        <SkeletonLine className="h-7 w-48 mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => <SkeletonProfileRow key={i} />)}
                        </div>
                    </div>

                    {/* Schedule section */}
                    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 space-y-4">
                        <SkeletonLine className="h-7 w-52 mb-4" />
                        <div className="flex gap-2 mb-6">
                            <SkeletonLine className="h-10 w-36 rounded-lg" />
                            <SkeletonLine className="h-10 w-36 rounded-lg" />
                        </div>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="border border-gray-200 rounded-2xl p-4 flex justify-between items-center">
                                <div className="space-y-2">
                                    <SkeletonLine className="h-5 w-24" />
                                    <SkeletonLine className="h-3 w-16" />
                                </div>
                                <SkeletonLine className="h-8 w-14 rounded-full" />
                            </div>
                        ))}
                    </div>

                    {/* Bookings table */}
                    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
                        <SkeletonLine className="h-7 w-48 mb-6" />
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    {['Date', 'Time Slot', 'Customer', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="text-left p-4">
                                            <SkeletonLine className="h-4 w-20" />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={5} />)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// CART PAGE skeleton
// ─────────────────────────────────────────────
export const CartSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <SkeletonLine className="h-9 w-48 mb-8" />
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCartItem key={i} />)}
                </div>
                <div className="w-full lg:w-80 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <SkeletonLine className="h-6 w-36" />
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <SkeletonLine className="h-4 w-28" />
                                <SkeletonLine className="h-4 w-16" />
                            </div>
                        ))}
                        <SkeletonLine className="h-px w-full bg-gray-200" />
                        <div className="flex justify-between">
                            <SkeletonLine className="h-5 w-16" />
                            <SkeletonLine className="h-5 w-20" />
                        </div>
                        <SkeletonLine className="h-12 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// WALLET PAGE skeleton
// ─────────────────────────────────────────────
export const WalletSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Title */}
            <div className="text-center mb-8 space-y-3">
                <SkeletonLine className="h-10 w-48 mx-auto" />
                <SkeletonLine className="h-5 w-72 mx-auto" />
            </div>
            {/* Balance card */}
            <div className="bg-gradient-to-r from-teal-400 to-teal-500 rounded-2xl p-8 mb-8">
                <div className="flex justify-between items-start">
                    <div className="space-y-3">
                        <SkeletonLine className="h-5 w-32 bg-teal-300/50" />
                        <SkeletonLine className="h-12 w-40 bg-teal-300/50" />
                        <SkeletonLine className="h-4 w-28 bg-teal-300/50" />
                    </div>
                    <SkeletonLine className="h-11 w-28 bg-teal-300/50 rounded-lg" />
                </div>
            </div>
            {/* Action cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 shadow-md border border-gray-100 space-y-3">
                        <SkeletonCircle className="w-12 h-12" />
                        <SkeletonLine className="h-5 w-28" />
                        <SkeletonLine className="h-3 w-full" />
                        <SkeletonLine className="h-3 w-3/4" />
                        <SkeletonLine className="h-9 w-full rounded-lg" />
                    </div>
                ))}
            </div>
            {/* Transactions */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <SkeletonLine className="h-7 w-44 mb-6" />
                {Array.from({ length: 6 }).map((_, i) => <SkeletonTransaction key={i} />)}
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// EVENTS PAGE skeleton
// ─────────────────────────────────────────────
export const EventsSkeleton = () => (
    <div className="bg-gray-50 min-h-screen pt-20">
        {/* Hero placeholder */}
        <SkeletonBlock className="w-full h-64 rounded-none mb-8" />
        <div className="max-w-7xl mx-auto px-4 flex gap-6">
            {/* Filter sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0 space-y-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-3">
                    <SkeletonLine className="h-5 w-24" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <SkeletonBlock className="w-4 h-4 rounded" />
                            <SkeletonLine className="h-4 w-28" />
                        </div>
                    ))}
                </div>
            </aside>
            {/* Cards grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// EVENT DETAIL skeleton
// ─────────────────────────────────────────────
export const EventDetailSkeleton = () => (
    <div className="bg-gray-50 min-h-screen pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main */}
                <div className="flex-1 space-y-6">
                    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                        <SkeletonLine className="h-6 w-24 rounded-full" />
                        <SkeletonLine className="h-9 w-3/4" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                                    <SkeletonCircle className="w-8 h-8 flex-shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <SkeletonLine className="h-4 w-16" />
                                        <SkeletonLine className="h-3 w-28" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <SkeletonBlock className="w-full h-56 rounded-lg" />
                        <SkeletonLine className="h-4 w-full" />
                        <SkeletonLine className="h-4 w-5/6" />
                        <SkeletonLine className="h-4 w-4/6" />
                    </div>
                </div>
                {/* Sidebar booking card */}
                <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-md p-6 space-y-5 sticky top-24">
                        <SkeletonLine className="h-7 w-32" />
                        <SkeletonLine className="h-10 w-full" />
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex justify-between">
                                    <SkeletonLine className="h-4 w-28" />
                                    <SkeletonLine className="h-4 w-20" />
                                </div>
                            ))}
                        </div>
                        <SkeletonLine className="h-12 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// EVENT TICKET skeleton
// ─────────────────────────────────────────────
export const EventTicketSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            <SkeletonLine className="h-8 w-40 mb-6" />
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                {/* QR placeholder */}
                <div className="flex justify-center">
                    <SkeletonBlock className="w-40 h-40" />
                </div>
                <SkeletonLine className="h-7 w-3/4 mx-auto" />
                <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-1">
                            <SkeletonLine className="h-3 w-20" />
                            <SkeletonLine className="h-4 w-32" />
                        </div>
                    ))}
                </div>
                <SkeletonLine className="h-12 w-full rounded-lg" />
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// EVENT PAYMENT skeleton
// ─────────────────────────────────────────────
export const EventPaymentSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
            <SkeletonLine className="h-9 w-48 mb-8" />
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 bg-white rounded-xl shadow-sm p-8 space-y-6">
                    <SkeletonLine className="h-6 w-40" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <SkeletonLine className="h-4 w-24" />
                            <SkeletonLine className="h-11 w-full rounded-lg" />
                        </div>
                    ))}
                    <div className="flex justify-end gap-3 pt-4">
                        <SkeletonLine className="h-11 w-28 rounded-lg" />
                        <SkeletonLine className="h-11 w-36 rounded-lg" />
                    </div>
                </div>
                <div className="w-full lg:w-72 bg-white rounded-xl shadow-sm p-6 space-y-4 h-fit">
                    <SkeletonLine className="h-6 w-32" />
                    <SkeletonBlock className="w-full h-40 rounded-lg" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                            <SkeletonLine className="h-4 w-24" />
                            <SkeletonLine className="h-4 w-16" />
                        </div>
                    ))}
                    <SkeletonLine className="h-px w-full" />
                    <div className="flex justify-between">
                        <SkeletonLine className="h-5 w-16" />
                        <SkeletonLine className="h-5 w-20" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// ORDER DETAILS skeleton
// ─────────────────────────────────────────────
export const OrderDetailsSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl" style={{ paddingTop: '6rem' }}>
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start pb-6 border-b-2 border-gray-100">
                    <div className="space-y-2">
                        <SkeletonLine className="h-8 w-44" />
                        <SkeletonLine className="h-4 w-32" />
                    </div>
                    <SkeletonLine className="h-10 w-28 rounded-full" />
                </div>
                {/* Customer info */}
                <div className="space-y-4">
                    <SkeletonLine className="h-6 w-48" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-1">
                                <SkeletonLine className="h-3 w-16" />
                                <SkeletonLine className="h-5 w-48" />
                            </div>
                        ))}
                    </div>
                </div>
                {/* Tracking steps */}
                <div className="space-y-3">
                    <SkeletonLine className="h-6 w-36" />
                    <div className="flex justify-between items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <SkeletonCircle className="w-10 h-10" />
                                <SkeletonLine className="h-3 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
                {/* Order items */}
                <div className="space-y-2">
                    <SkeletonLine className="h-6 w-28 mb-4" />
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonOrderItem key={i} />)}
                </div>
                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-3 max-w-xs ml-auto">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                            <SkeletonLine className="h-4 w-24" />
                            <SkeletonLine className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// PET DETAIL skeleton
// ─────────────────────────────────────────────
export const PetDetailSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                    {/* Image gallery */}
                    <div className="flex flex-col gap-4">
                        <SkeletonBlock className="w-full aspect-square rounded-lg" />
                        <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <SkeletonBlock key={i} className="aspect-square rounded-lg" />
                            ))}
                        </div>
                    </div>
                    {/* Info panel */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <SkeletonLine className="h-9 w-48" />
                            <SkeletonLine className="h-6 w-32 rounded-full" />
                            <SkeletonLine className="h-4 w-full" />
                            <SkeletonLine className="h-4 w-5/6" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-1">
                                    <SkeletonLine className="h-3 w-20" />
                                    <SkeletonLine className="h-5 w-28" />
                                </div>
                            ))}
                        </div>
                        <SkeletonLine className="h-12 w-full rounded-lg" />
                        <SkeletonLine className="h-12 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// CHECKOUT skeleton
// ─────────────────────────────────────────────
export const CheckoutSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
                {/* Form */}
                <div className="flex-1 bg-white rounded-xl shadow-sm p-8 space-y-6">
                    <SkeletonLine className="h-7 w-48" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <SkeletonLine className="h-4 w-28" />
                            <SkeletonLine className="h-11 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
                {/* Summary */}
                <div className="w-full lg:w-80 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-gray-100">
                        <SkeletonLine className="h-6 w-32" />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <SkeletonBlock className="w-12 h-12 rounded-lg" />
                                <div className="flex-1 space-y-1">
                                    <SkeletonLine className="h-4 w-32" />
                                    <SkeletonLine className="h-3 w-20" />
                                </div>
                                <SkeletonLine className="h-4 w-14" />
                            </div>
                        ))}
                        <SkeletonLine className="h-px w-full" />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <SkeletonLine className="h-4 w-24" />
                                <SkeletonLine className="h-4 w-16" />
                            </div>
                        ))}
                        <SkeletonLine className="h-12 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// SERVICE CARD skeleton (for services listing)
// ─────────────────────────────────────────────
export const SkeletonServiceCard = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <SkeletonBlock className="w-full h-48 rounded-none" />
        <div className="p-6 space-y-3">
            <div className="flex justify-between items-start">
                <SkeletonLine className="h-6 w-36" />
                <SkeletonLine className="h-6 w-16 rounded-full" />
            </div>
            <SkeletonLine className="h-4 w-28" />
            <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonBlock key={i} className="w-4 h-4 rounded-sm" />
                ))}
                <SkeletonLine className="h-4 w-20 ml-2" />
            </div>
            <SkeletonLine className="h-4 w-48" />
            <SkeletonLine className="h-4 w-32" />
            <SkeletonLine className="h-10 w-full rounded-md mt-2" />
        </div>
    </div>
);

// ─────────────────────────────────────────────
// PRODUCTS PAGE skeleton (inline grid — sidebar stays visible)
// ─────────────────────────────────────────────
export const ProductsGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
);

// ─────────────────────────────────────────────
// SERVICES PAGE skeleton (full page)
// ─────────────────────────────────────────────
export const ServicesSkeleton = () => (
    <div className="bg-gray-50 min-h-screen" style={{ paddingTop: '80px' }}>
        <SkeletonBlock className="w-full h-36 rounded-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-6">
                <aside className="lg:w-64 shrink-0">
                    <div className="bg-white rounded-lg shadow-md p-6 space-y-5">
                        <SkeletonLine className="h-6 w-24" />
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <SkeletonBlock className="w-4 h-4 rounded" />
                                    <SkeletonLine className="h-4 w-32" />
                                </div>
                            ))}
                        </div>
                        <SkeletonLine className="h-px w-full" />
                        <SkeletonLine className="h-5 w-28" />
                        <div className="flex gap-2">
                            <SkeletonLine className="h-9 flex-1 rounded-md" />
                            <SkeletonLine className="h-9 flex-1 rounded-md" />
                        </div>
                        <SkeletonLine className="h-10 w-full rounded-md" />
                    </div>
                </aside>
                <main className="flex-1">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <SkeletonLine className="h-7 w-52" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonServiceCard key={i} />)}
                    </div>
                </main>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// PRODUCT DETAIL skeleton
// ─────────────────────────────────────────────
export const ProductDetailSkeleton = () => (
    <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-10">
                <div className="lg:w-1/2 space-y-4">
                    <SkeletonBlock className="w-full aspect-square rounded-xl" />
                    <div className="flex gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonBlock key={i} className="w-20 h-20 rounded-lg" />
                        ))}
                    </div>
                </div>
                <div className="lg:w-1/2 space-y-5">
                    <SkeletonLine className="h-5 w-24 rounded-full" />
                    <SkeletonLine className="h-9 w-3/4" />
                    <SkeletonLine className="h-8 w-32" />
                    <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <SkeletonBlock key={i} className="w-5 h-5 rounded-sm" />
                        ))}
                        <SkeletonLine className="h-4 w-24 ml-1" />
                    </div>
                    <SkeletonLine className="h-px w-full" />
                    <div className="space-y-2">
                        <SkeletonLine className="h-4 w-full" />
                        <SkeletonLine className="h-4 w-5/6" />
                        <SkeletonLine className="h-4 w-4/6" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <SkeletonLine className="h-12 w-36 rounded-lg" />
                        <SkeletonLine className="h-12 flex-1 rounded-lg" />
                        <SkeletonLine className="h-12 w-12 rounded-lg" />
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <SkeletonCircle className="w-8 h-8" />
                                <SkeletonLine className="h-4 w-48" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// SERVICE DETAIL skeleton
// ─────────────────────────────────────────────
export const ServiceDetailSkeleton = () => (
    <div className="bg-gray-50 min-h-screen" style={{ paddingTop: '95px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SkeletonLine className="h-5 w-36 mb-6" />
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <SkeletonBlock className="w-full h-64 rounded-none" />
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <SkeletonLine className="h-8 w-56" />
                                    <SkeletonLine className="h-5 w-32" />
                                </div>
                                <div className="space-y-1">
                                    <SkeletonLine className="h-8 w-24" />
                                    <SkeletonLine className="h-4 w-16" />
                                </div>
                            </div>
                            <div className="flex gap-1 items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <SkeletonBlock key={i} className="w-5 h-5 rounded-sm" />
                                ))}
                                <SkeletonLine className="h-4 w-28 ml-2" />
                            </div>
                            <div className="space-y-2">
                                <SkeletonLine className="h-4 w-full" />
                                <SkeletonLine className="h-4 w-5/6" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <SkeletonBlock className="h-16 rounded-lg" />
                                <SkeletonBlock className="h-16 rounded-lg" />
                            </div>
                            <SkeletonLine className="h-px w-full" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <SkeletonCircle className="w-5 h-5" />
                                    <SkeletonLine className="h-4 w-48" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <SkeletonLine className="h-7 w-28" />
                            <SkeletonLine className="h-9 w-32 rounded-md" />
                        </div>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex gap-3 py-4 border-b border-gray-100 last:border-b-0">
                                <SkeletonCircle className="w-10 h-10 flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <SkeletonLine className="h-4 w-32" />
                                    <SkeletonLine className="h-3 w-full" />
                                    <SkeletonLine className="h-3 w-4/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                        <SkeletonLine className="h-7 w-36" />
                        <SkeletonLine className="h-4 w-full" />
                        <SkeletonLine className="h-10 w-full rounded-md" />
                        <SkeletonLine className="h-12 w-full rounded-md" />
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
                        <SkeletonLine className="h-6 w-32" />
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <SkeletonCircle className="w-5 h-5" />
                                <SkeletonLine className="h-4 w-40" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);
