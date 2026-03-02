import { useState, useEffect } from 'react';
import {
    getAvailability,
    updateAvailability,
    blockDate,
    unblockDate
} from '../services/serviceProviderService';
import {
    FaCalendarAlt, FaClock, FaPlus, FaTrash,
    FaChevronLeft, FaChevronRight, FaSave,
    FaToggleOn, FaToggleOff, FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};
const DAY_COLORS = {
    monday: 'indigo', tuesday: 'blue', wednesday: 'violet',
    thursday: 'purple', friday: 'pink', saturday: 'orange', sunday: 'red'
};

const defaultSchedule = () => {
    const s = {};
    DAYS.forEach(d => { s[d] = { isHoliday: true, slots: [] }; });
    return s;
};

const ScheduleManager = () => {
    const [activeTab, setActiveTab] = useState('weekly');
    const [schedule, setSchedule] = useState(defaultSchedule());
    const [blockedDates, setBlockedDates] = useState([]);
    const [calMonth, setCalMonth] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d;
    });
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [savingDate, setSavingDate] = useState(null);
    const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

    useEffect(() => { loadAvailability(); }, []);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    const loadAvailability = async () => {
        try {
            const res = await getAvailability();
            const data = res.data?.data;
            if (data) {
                const sched = defaultSchedule();
                (data.days || []).forEach(d => {
                    sched[d.day] = {
                        isHoliday: d.isHoliday,
                        slots: (d.slots || []).map(s => ({ start: s.start || '09:00', end: s.end || '17:00' }))
                    };
                });
                setSchedule(sched);
                setBlockedDates(data.blockedDates || []);
            }
        } catch (err) {
            console.error('Failed to load availability:', err);
        }
    };

    // ── Weekly Schedule helpers ──────────────────────────────────
    const toggleDay = (day) => {
        setSchedule(prev => {
            const wasHoliday = prev[day].isHoliday;
            return {
                ...prev,
                [day]: {
                    isHoliday: !wasHoliday,
                    slots: wasHoliday ? [{ start: '09:00', end: '17:00' }] : prev[day].slots
                }
            };
        });
    };

    const addSlot = (day) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                slots: [...prev[day].slots, { start: '09:00', end: '17:00' }]
            }
        }));
    };

    const removeSlot = (day, idx) => {
        setSchedule(prev => {
            const newSlots = prev[day].slots.filter((_, i) => i !== idx);
            return {
                ...prev,
                [day]: { isHoliday: newSlots.length === 0, slots: newSlots }
            };
        });
    };

    const updateSlot = (day, idx, field, value) => {
        setSchedule(prev => {
            const newSlots = prev[day].slots.map((s, i) =>
                i === idx ? { ...s, [field]: value } : s
            );
            return { ...prev, [day]: { ...prev[day], slots: newSlots } };
        });
    };

    const saveSchedule = async () => {
        try {
            setSavingSchedule(true);
            const days = DAYS.map(d => ({
                day: d,
                isHoliday: schedule[d].isHoliday,
                slots: schedule[d].isHoliday
                    ? []
                    : schedule[d].slots.filter(s => s.start && s.end)
            }));
            await updateAvailability({ days });
            showToast('success', 'Weekly schedule saved successfully!');
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Failed to save schedule.');
        } finally {
            setSavingSchedule(false);
        }
    };

    // ── Blocked Dates helpers ─────────────────────────────────────
    const toggleBlockedDate = async (dateStr) => {
        const isBlocked = blockedDates.includes(dateStr);
        setSavingDate(dateStr);
        try {
            if (isBlocked) {
                await unblockDate(dateStr);
                setBlockedDates(prev => prev.filter(d => d !== dateStr));
                showToast('success', `${dateStr} is now available.`);
            } else {
                await blockDate(dateStr);
                setBlockedDates(prev => [...prev, dateStr]);
                showToast('success', `${dateStr} has been blocked.`);
            }
        } catch (err) {
            showToast('error', 'Failed to update date. Please try again.');
        } finally {
            setSavingDate(null);
        }
    };

    const prevMonth = () => setCalMonth(d => {
        const n = new Date(d);
        n.setMonth(n.getMonth() - 1);
        return n;
    });
    const nextMonth = () => setCalMonth(d => {
        const n = new Date(d);
        n.setMonth(n.getMonth() + 1);
        return n;
    });

    const renderCalendar = () => {
        const year = calMonth.getFullYear();
        const month = calMonth.getMonth();
        const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date().toISOString().split('T')[0];

        const blanks = Array.from({ length: firstDow }, (_, i) => (
            <div key={`b${i}`} />
        ));

        const cells = Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isPast = dateStr < today;
            const isBlocked = blockedDates.includes(dateStr);
            const isToday = dateStr === today;
            const isSaving = savingDate === dateStr;

            let cls = 'aspect-square rounded-xl text-sm font-semibold transition-all flex items-center justify-center relative ';
            if (isPast) {
                cls += 'text-gray-300 bg-gray-50 cursor-not-allowed';
            } else if (isSaving) {
                cls += 'bg-yellow-100 text-yellow-600 cursor-wait animate-pulse';
            } else if (isBlocked) {
                cls += 'bg-red-500 text-white hover:bg-red-600 cursor-pointer shadow-md';
            } else if (isToday) {
                cls += 'bg-indigo-100 text-indigo-700 hover:bg-red-100 hover:text-red-600 cursor-pointer border-2 border-indigo-400';
            } else {
                cls += 'bg-green-50 text-gray-700 hover:bg-red-100 hover:text-red-600 cursor-pointer';
            }

            return (
                <button
                    key={dateStr}
                    onClick={() => !isPast && !isSaving && toggleBlockedDate(dateStr)}
                    disabled={isPast || !!isSaving}
                    className={cls}
                    title={isPast ? 'Past date' : isBlocked ? 'Click to unblock' : 'Click to block'}
                >
                    {d}
                    {isBlocked && !isSaving && (
                        <span className="absolute top-0.5 right-0.5 text-[8px]">✕</span>
                    )}
                </button>
            );
        });

        return [...blanks, ...cells];
    };

    const monthName = calMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    const blockedThisMonth = blockedDates.filter(d => {
        const year = calMonth.getFullYear();
        const month = String(calMonth.getMonth() + 1).padStart(2, '0');
        return d.startsWith(`${year}-${month}`);
    }).length;

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all
                    ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.type === 'success'
                        ? <FaCheckCircle className="text-xl" />
                        : <FaExclamationCircle className="text-xl" />}
                    {toast.msg}
                </div>
            )}

            {/* Tab Switcher */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('weekly')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
                        ${activeTab === 'weekly'
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FaClock /> Weekly Schedule
                </button>
                <button
                    onClick={() => setActiveTab('blocked')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
                        ${activeTab === 'blocked'
                            ? 'bg-white text-red-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FaCalendarAlt /> Block Dates
                    {blockedDates.length > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                            {blockedDates.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── WEEKLY SCHEDULE TAB ── */}
            {activeTab === 'weekly' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Weekly Working Hours</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Toggle days on/off and set custom time ranges for each working day.
                            </p>
                        </div>
                        <button
                            onClick={saveSchedule}
                            disabled={savingSchedule}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-60 font-semibold shadow-md hover:shadow-lg text-sm"
                        >
                            <FaSave />
                            {savingSchedule ? 'Saving...' : 'Save Schedule'}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {DAYS.map(day => {
                            const dayData = schedule[day];
                            const isWorking = !dayData.isHoliday;
                            const color = DAY_COLORS[day];
                            return (
                                <div
                                    key={day}
                                    className={`border-2 rounded-2xl overflow-hidden transition-all
                                        ${isWorking ? `border-${color}-200 bg-${color}-50/30` : 'border-gray-200 bg-gray-50/50'}`}
                                >
                                    {/* Day Header */}
                                    <div className="flex items-center justify-between px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <span className={`font-bold text-base ${isWorking ? 'text-gray-800' : 'text-gray-400'}`}>
                                                {DAY_LABELS[day]}
                                            </span>
                                            {isWorking ? (
                                                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-0.5 rounded-full">
                                                    Working
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-gray-200 text-gray-500 font-semibold px-2.5 py-0.5 rounded-full">
                                                    Day Off
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => toggleDay(day)}
                                            className="flex items-center gap-2 text-sm font-medium transition-colors"
                                        >
                                            {isWorking ? (
                                                <FaToggleOn className="text-3xl text-indigo-600" />
                                            ) : (
                                                <FaToggleOff className="text-3xl text-gray-400" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Slots */}
                                    {isWorking && (
                                        <div className="px-5 pb-4 space-y-2">
                                            {dayData.slots.map((slot, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                                                    <FaClock className="text-gray-400 flex-shrink-0" />
                                                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-gray-500 font-medium">From</label>
                                                            <input
                                                                type="time"
                                                                value={slot.start}
                                                                onChange={e => updateSlot(day, idx, 'start', e.target.value)}
                                                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-gray-500 font-medium">To</label>
                                                            <input
                                                                type="time"
                                                                value={slot.end}
                                                                min={slot.start}
                                                                onChange={e => updateSlot(day, idx, 'end', e.target.value)}
                                                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                            />
                                                        </div>
                                                        {slot.start && slot.end && slot.end > slot.start && (
                                                            <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                                                                {(() => {
                                                                    const [sh, sm] = slot.start.split(':').map(Number);
                                                                    const [eh, em] = slot.end.split(':').map(Number);
                                                                    const mins = (eh * 60 + em) - (sh * 60 + sm);
                                                                    const h = Math.floor(mins / 60);
                                                                    const m = mins % 60;
                                                                    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
                                                                })()} available
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => removeSlot(day, idx)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                        title="Remove this time range"
                                                    >
                                                        <FaTrash size={13} />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => addSlot(day)}
                                                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors mt-1"
                                            >
                                                <FaPlus size={12} /> Add Time Range
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={saveSchedule}
                            disabled={savingSchedule}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-60 font-semibold shadow-md text-sm"
                        >
                            <FaSave />
                            {savingSchedule ? 'Saving...' : 'Save Schedule'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── BLOCKED DATES TAB ── */}
            {activeTab === 'blocked' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Block Specific Dates</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Click any future date to toggle it blocked. Customers cannot book on blocked dates.
                            </p>
                        </div>
                        {blockedDates.length > 0 && (
                            <span className="text-sm text-red-600 font-semibold bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                                {blockedDates.length} date{blockedDates.length > 1 ? 's' : ''} blocked
                            </span>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-green-50 border border-gray-200" />
                            <span className="text-gray-600">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-red-500" />
                            <span className="text-gray-600">Blocked</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-100 border-2 border-indigo-400" />
                            <span className="text-gray-600">Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-gray-50 border border-gray-200" />
                            <span className="text-gray-400">Past (locked)</span>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Navigation */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                            <button
                                onClick={prevMonth}
                                className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-gray-600"
                            >
                                <FaChevronLeft />
                            </button>
                            <div className="text-center">
                                <div className="font-bold text-gray-800 text-lg">{monthName}</div>
                                {blockedThisMonth > 0 && (
                                    <div className="text-xs text-red-500 font-medium">
                                        {blockedThisMonth} blocked this month
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={nextMonth}
                                className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-gray-600"
                            >
                                <FaChevronRight />
                            </button>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-1 px-4 pt-4 pb-1">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                            ))}
                        </div>

                        {/* Date Grid */}
                        <div className="grid grid-cols-7 gap-1.5 p-4">
                            {renderCalendar()}
                        </div>
                    </div>

                    {/* Blocked Dates List */}
                    {blockedDates.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                            <h4 className="font-bold text-red-700 mb-3 text-sm flex items-center gap-2">
                                <FaCalendarAlt /> All Blocked Dates ({blockedDates.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {[...blockedDates].sort().map(d => (
                                    <div key={d} className="flex items-center gap-1.5 bg-white border border-red-200 rounded-xl px-3 py-1.5 text-sm">
                                        <span className="text-gray-700 font-medium">{d}</span>
                                        <button
                                            onClick={() => toggleBlockedDate(d)}
                                            disabled={savingDate === d}
                                            className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                            title="Unblock this date"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ScheduleManager;
