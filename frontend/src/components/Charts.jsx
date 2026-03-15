/**
 * Premium Chart Components — PlantFlow
 * Built on Recharts with SVG glow effects, animated gradients,
 * glassmorphism tooltips, and smooth entrance animations.
 */
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    ResponsiveContainer,
    AreaChart, Area,
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    RadialBarChart, RadialBar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

// ── Color palette ──────────────────────────────────────────────────────
const CHART_COLORS = [
    '#8b5cf6', '#f97316', '#3b82f6', '#ec4899',
    '#14b8a6', '#f59e0b', '#6366f1', '#10b981',
];

export function getChartColor(index) {
    return CHART_COLORS[index % CHART_COLORS.length];
}

// ── Number abbreviation ────────────────────────────────────────────────
function abbreviateNumber(val) {
    if (val == null || isNaN(val)) return val;
    const abs = Math.abs(val);
    if (abs >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (abs >= 1e4) return `${(val / 1e3).toFixed(1)}K`;
    if (abs >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return val;
}

// ── SVG Glow Filter (reusable) ─────────────────────────────────────────
function GlowFilters({ dataKeys, colors }) {
    return (
        <defs>
            {/* Per-series glow filters */}
            {dataKeys.map((key, i) => {
                const color = colors?.[i] || getChartColor(i);
                return (
                    <filter key={`glow-${key}`} id={`glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                        <feFlood floodColor={color} floodOpacity="0.3" result="color" />
                        <feComposite in="color" in2="blur" operator="in" result="shadow" />
                        <feMerge>
                            <feMergeNode in="shadow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                );
            })}
            {/* Multi-stop gradients */}
            {dataKeys.map((key, i) => {
                const color = colors?.[i] || getChartColor(i);
                return (
                    <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="60%" stopColor={color} stopOpacity={0.1} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                    </linearGradient>
                );
            })}
        </defs>
    );
}

// ── Premium Animated Tooltip ───────────────────────────────────────────
function PremiumTooltip({ active, payload, label, formatter }) {
    if (!active || !payload?.length) return null;
    const total = payload.length > 1 ? payload.reduce((s, e) => s + (typeof e.value === 'number' ? e.value : 0), 0) : null;
    return (
        <div className="premium-tooltip">
            {label && <p className="tooltip-label">{label}</p>}
            {payload.map((entry, i) => (
                <div key={i} className="tooltip-row">
                    <span className="tooltip-dot" style={{ background: entry.color, boxShadow: `0 0 6px ${entry.color}` }} />
                    <span className="tooltip-name">{entry.name}:</span>
                    <span className="tooltip-value">
                        {formatter ? formatter(entry.value, entry.name) : (typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value)}
                    </span>
                </div>
            ))}
            {total != null && (
                <div className="tooltip-total font-mono mt-2 pt-2 border-t border-pf-border font-bold text-[13px] text-pf-accent">
                    <span className="tooltip-name">Total:</span>
                    <span className="tooltip-value ml-3">{total.toLocaleString()}</span>
                </div>
            )}
        </div>
    );
}

// ── Custom Active Dot with pulse ───────────────────────────────────────
function PulsingDot({ cx, cy, stroke, fill }) {
    if (cx == null || cy == null) return null;
    return (
        <g>
            <circle cx={cx} cy={cy} r="12" fill={fill || stroke} opacity="0.15" className="animate-pulse-ring" />
            <circle cx={cx} cy={cy} r="6" fill="transparent" stroke={stroke} strokeWidth="2" opacity="0.4" />
            <circle cx={cx} cy={cy} r="4" fill={fill || stroke} stroke="#ffffff" strokeWidth="1.5" />
        </g>
    );
}

// ── Custom Legend ──────────────────────────────────────────────────────
function PremiumLegend({ payload }) {
    if (!payload?.length) return null;
    return (
        <div className="flex flex-wrap justify-center gap-4 pt-3">
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-pf-muted">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color, boxShadow: `0 0 6px ${entry.color}60` }} />
                    <span>{entry.value}</span>
                </div>
            ))}
        </div>
    );
}

// ── Chart Card wrapper with entrance animation ─────────────────────────
export function ChartCard({ title, description, children, className = '', action, delay = 0 }) {
    return (
        <motion.div
            className={`glass-card p-5 ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay * 0.08, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h3 className="font-mono text-[16px] tracking-wide font-bold text-pf-text leading-tight">{title}</h3>
                    {description && <p className="text-[12px] text-pf-muted mt-1.5 opacity-80">{description}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>
            {children}
        </motion.div>
    );
}

// ── Shared axis/grid config ────────────────────────────────────────────
const axisProps = {
    tick: { fill: '#64748b', fontSize: 10, fontFamily: 'Inter, sans-serif' },
    axisLine: false,
    tickLine: false,
};
const gridProps = {
    strokeDasharray: '3 6',
    stroke: 'rgba(31,38,135,0.06)',
    vertical: false,
};

// ── Area Chart ─────────────────────────────────────────────────────────
export function ShadcnAreaChart({
    data, dataKeys, colors, height = 280, stacked = false,
    xKey = 'date', formatter, showGrid = true, showLegend = true,
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <GlowFilters dataKeys={dataKeys} colors={colors} />
                {showGrid && <CartesianGrid {...gridProps} />}
                <XAxis dataKey={xKey} {...axisProps} dy={8} />
                <YAxis {...axisProps} tickFormatter={abbreviateNumber} dx={-4} />
                <Tooltip content={<PremiumTooltip formatter={formatter} />} />
                {showLegend && <Legend content={<PremiumLegend />} />}
                {dataKeys.map((key, i) => (
                    <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors?.[i] || getChartColor(i)}
                        strokeWidth={3}
                        fill={`url(#grad-${key})`}
                        stackId={stacked ? 'stack' : undefined}
                        name={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                        filter={`url(#glow-${key})`}
                        activeDot={<PulsingDot />}
                        dot={false}
                        animationDuration={1200}
                        animationEasing="ease-out"
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ── Bar Chart ──────────────────────────────────────────────────────────
export function ShadcnBarChart({
    data, dataKeys, colors, height = 280, stacked = false,
    xKey = 'label', formatter, showGrid = true, showLegend = true, layout = 'horizontal',
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout={layout} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                    {dataKeys.map((key, i) => {
                        const color = colors?.[i] || getChartColor(i);
                        return (
                            <linearGradient key={`bar-grad-${key}`} id={`bar-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={1} />
                                <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                            </linearGradient>
                        );
                    })}
                    {dataKeys.map((key, i) => {
                        const color = colors?.[i] || getChartColor(i);
                        return (
                            <filter key={`bar-glow-${key}`} id={`bar-glow-${key}`} x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                                <feFlood floodColor={color} floodOpacity="0.45" result="color" />
                                <feComposite in="color" in2="blur" operator="in" result="shadow" />
                                <feMerge>
                                    <feMergeNode in="shadow" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        );
                    })}
                </defs>
                {showGrid && <CartesianGrid {...gridProps} />}
                {layout === 'horizontal' ? (
                    <>
                        <XAxis dataKey={xKey} {...axisProps} dy={8} />
                        <YAxis {...axisProps} tickFormatter={abbreviateNumber} dx={-4} />
                    </>
                ) : (
                    <>
                        <XAxis type="number" {...axisProps} tickFormatter={abbreviateNumber} />
                        <YAxis dataKey={xKey} type="category" {...axisProps} width={80} />
                    </>
                )}
                <Tooltip content={<PremiumTooltip formatter={formatter} />} cursor={{ fill: 'rgba(0,212,255,0.03)', radius: 4 }} />
                {showLegend && <Legend content={<PremiumLegend />} />}
                {dataKeys.map((key, i) => (
                    <Bar
                        key={key}
                        dataKey={key}
                        fill={`url(#bar-grad-${key})`}
                        radius={[6, 6, 2, 2]}
                        stackId={stacked ? 'stack' : undefined}
                        name={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                        filter={`url(#bar-glow-${key})`}
                        animationDuration={1000}
                        animationEasing="ease-out"
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}

// ── Line Chart ─────────────────────────────────────────────────────────
export function ShadcnLineChart({
    data, dataKeys, colors, height = 280,
    xKey = 'date', formatter, showGrid = true, showLegend = true, showDots = false,
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <GlowFilters dataKeys={dataKeys} colors={colors} />
                {showGrid && <CartesianGrid {...gridProps} />}
                <XAxis dataKey={xKey} {...axisProps} dy={8} />
                <YAxis {...axisProps} tickFormatter={abbreviateNumber} dx={-4} />
                <Tooltip content={<PremiumTooltip formatter={formatter} />} />
                {showLegend && <Legend content={<PremiumLegend />} />}
                {dataKeys.map((key, i) => (
                    <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors?.[i] || getChartColor(i)}
                        strokeWidth={3.5}
                        dot={showDots ? { r: 4, fill: '#ffffff', strokeWidth: 2, stroke: colors?.[i] || getChartColor(i) } : false}
                        activeDot={<PulsingDot />}
                        filter={`url(#glow-${key})`}
                        name={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                        animationDuration={1200}
                        animationEasing="ease-out"
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}

// ── Pie / Donut Chart ──────────────────────────────────────────────────
export function ShadcnPieChart({
    data, dataKey = 'value', nameKey = 'name',
    height = 280, innerRadius = 65, outerRadius = 95, colors,
    centerLabel, centerValue,
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <defs>
                    {data.map((_, i) => {
                        const color = colors?.[i] || getChartColor(i);
                        return (
                            <filter key={`pie-glow-${i}`} id={`pie-glow-${i}`} x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                                <feFlood floodColor={color} floodOpacity="0.35" result="color" />
                                <feComposite in="color" in2="blur" operator="in" result="shadow" />
                                <feMerge>
                                    <feMergeNode in="shadow" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        );
                    })}
                </defs>
                <Pie
                    data={data}
                    dataKey={dataKey}
                    nameKey={nameKey}
                    cx="50%"
                    cy="50%"
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    strokeWidth={2}
                    stroke="#ffffff"
                    paddingAngle={2}
                    animationDuration={1000}
                    animationEasing="ease-out"
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={colors?.[i] || getChartColor(i)} filter={`url(#pie-glow-${i})`} />
                    ))}
                </Pie>
                <Tooltip content={<PremiumTooltip />} />
                <Legend content={<PremiumLegend />} />
                {/* Center label for donut */}
                {centerLabel && (
                    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
                        fill="#94a3b8" fontSize="10" fontFamily="Inter" letterSpacing="1.5">
                        {centerLabel.toUpperCase()}
                    </text>
                )}
                {centerValue && (
                    <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle"
                        fill="#e2e8f0" fontSize="22" fontWeight="700" fontFamily="JetBrains Mono">
                        {centerValue}
                    </text>
                )}
            </PieChart>
        </ResponsiveContainer>
    );
}

// ── Gauge Chart (new) ──────────────────────────────────────────────────
export function ShadcnGaugeChart({
    value = 0, max = 100, label = '', height = 200, color = '#00d4ff',
}) {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className="relative" style={{ height }}>
            <ResponsiveContainer width="100%" height={height}>
                <RadialBarChart
                    cx="50%" cy="65%"
                    innerRadius="70%"
                    outerRadius="90%"
                    data={[{ value: percentage, fill: color }]}
                    startAngle={200}
                    endAngle={-20}
                >
                    <defs>
                        <linearGradient id={`gauge-grad-${label}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={color} stopOpacity={0.7} />
                            <stop offset="100%" stopColor={color} stopOpacity={1} />
                        </linearGradient>
                        <filter id={`gauge-glow-${label}`} x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                            <feFlood floodColor={color} floodOpacity="0.5" result="color" />
                            <feComposite in="color" in2="blur" operator="in" result="shadow" />
                            <feMerge>
                                <feMergeNode in="shadow" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <RadialBar
                        dataKey="value"
                        cornerRadius={12}
                        fill={`url(#gauge-grad-${label})`}
                        filter={`url(#gauge-glow-${label})`}
                        background={{ fill: 'rgba(31,38,135,0.05)' }}
                        animationDuration={1400}
                        animationEasing="ease-out"
                    />
                </RadialBarChart>
            </ResponsiveContainer>
            {/* Center text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: height * 0.1 }}>
                <span className="font-mono text-[28px] font-bold text-pf-text" style={{ textShadow: `0 0 20px ${color}40` }}>
                    {value}
                </span>
                {label && <span className="text-[10px] text-pf-muted uppercase tracking-[1.5px] mt-0.5">{label}</span>}
            </div>
        </div>
    );
}

// ── Radial Chart (for gauges) ──────────────────────────────────────────
export function ShadcnRadialChart({
    data, dataKey = 'value', height = 200, colors,
    innerRadius = 60, outerRadius = 80,
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RadialBarChart
                cx="50%" cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                data={data}
                startAngle={180}
                endAngle={0}
            >
                <defs>
                    <filter id="radial-glow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                        <feFlood floodColor={colors?.[0] || getChartColor(0)} floodOpacity="0.4" result="color" />
                        <feComposite in="color" in2="blur" operator="in" result="shadow" />
                        <feMerge>
                            <feMergeNode in="shadow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <RadialBar
                    dataKey={dataKey}
                    cornerRadius={8}
                    fill={colors?.[0] || getChartColor(0)}
                    background={{ fill: 'rgba(31,38,135,0.05)' }}
                    filter="url(#radial-glow)"
                    animationDuration={1200}
                />
                <Tooltip content={<PremiumTooltip />} />
            </RadialBarChart>
        </ResponsiveContainer>
    );
}

// ── Animated Number Counter ────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1200 }) {
    const [display, setDisplay] = useState('0');
    const frameRef = useRef(null);

    useEffect(() => {
        // Parse the numeric portion
        const str = String(value);
        const numMatch = str.match(/[\d,.]+/);
        if (!numMatch) { setDisplay(str); return; }

        const numStr = numMatch[0].replace(/,/g, '');
        const target = parseFloat(numStr);
        if (isNaN(target)) { setDisplay(str); return; }

        const prefix = str.slice(0, numMatch.index);
        const suffix = str.slice(numMatch.index + numMatch[0].length);
        const isFloat = numStr.includes('.');
        const decimals = isFloat ? (numStr.split('.')[1]?.length || 1) : 0;
        const start = performance.now();

        const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;

            if (isFloat) {
                setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);
            } else {
                setDisplay(`${prefix}${Math.floor(current).toLocaleString()}${suffix}`);
            }

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                // Ensure final value is exact
                setDisplay(str);
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [value, duration]);

    return <>{display}</>;
}

// ── KPI Stat Card (Premium) ────────────────────────────────────────────
export function StatCard({ icon, label, value, delta, trend, color = 'border-t-pf-accent', className = '', delay = 0 }) {
    return (
        <motion.div
            className={`glass-card p-5 border-t-2 ${color} stat-card-hover ${className}`}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: delay * 0.08, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
            {icon && <div className="text-[26px] mb-2.5">{icon}</div>}
            <div className="text-[10px] text-pf-muted tracking-[1.5px] uppercase mb-1.5 font-medium">{label}</div>
            <div className="font-mono text-[28px] font-bold text-pf-text leading-none">
                <AnimatedNumber value={String(value)} />
            </div>
            {delta && (
                <div className={`text-[11px] mt-1.5 font-medium ${trend === 'up' ? 'text-pf-green' : trend === 'down' ? 'text-pf-red' : 'text-pf-muted'}`}>
                    {trend === 'up' && '↑ '}{trend === 'down' && '↓ '}{delta}
                </div>
            )}
        </motion.div>
    );
}
