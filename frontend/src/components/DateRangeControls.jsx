import { useState } from 'react';

/**
 * Shared date-range controls for all dashboards.
 * Provides: calendar from/to pickers, 15/30 day preset buttons, and export Excel button.
 *
 * Props:
 *   - days: current selected days (number)
 *   - onDaysChange: (days: number) => void
 *   - onDateRangeChange: ({ from, to }) => void  — called with ISO date strings
 *   - onExport: () => void — download handler
 *   - loading: boolean — export in progress
 */
export default function DateRangeControls({ days, onDaysChange, onDateRangeChange, onExport, loading }) {
    const [mode, setMode] = useState('preset'); // 'preset' or 'custom'
    const today = new Date().toISOString().split('T')[0];
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const handlePreset = (d) => {
        setMode('preset');
        onDaysChange(d);
    };

    const handleCustomApply = () => {
        if (from && to) {
            setMode('custom');
            onDateRangeChange({ from, to });
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Preset buttons */}
            <div className="flex gap-1.5">
                {[7, 15, 30].map(d => (
                    <button
                        key={d}
                        type="button"
                        onClick={() => handlePreset(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border
                            ${mode === 'preset' && days === d
                                ? 'bg-pf-accent/20 text-pf-accent border-pf-accent/30'
                                : 'bg-white/50 text-pf-muted border-pf-border hover:text-pf-text hover:bg-white/80'
                            }`}
                    >
                        {d}d
                    </button>
                ))}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-pf-border" />

            {/* Calendar date range */}
            <div className="flex items-center gap-1.5">
                <input
                    type="date"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    max={to || today}
                    className="pf-input w-auto text-xs !py-1.5 !px-2"
                    title="From date"
                />
                <span className="text-pf-muted text-xs">→</span>
                <input
                    type="date"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    min={from}
                    max={today}
                    className="pf-input w-auto text-xs !py-1.5 !px-2"
                    title="To date"
                />
                <button
                    type="button"
                    onClick={handleCustomApply}
                    disabled={!from || !to}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-pf-accent/15 text-pf-accent border border-pf-accent/20 hover:bg-pf-accent/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Apply
                </button>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-pf-border" />

            {/* Export button */}
            <button
                type="button"
                onClick={onExport}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <span className="animate-spin">⏳</span> Exporting...
                    </>
                ) : (
                    <>📥 Export Excel</>
                )}
            </button>
        </div>
    );
}
