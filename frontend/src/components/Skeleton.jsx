export function SkeletonLine({ className = '' }) {
    return (
        <div className={`h-4 rounded bg-slate-200/60 animate-pulse ${className}`} />
    );
}

export function SkeletonCard({ className = '' }) {
    return (
        <div className={`glass-card p-6 space-y-4 ${className}`}>
            <SkeletonLine className="w-1/3 h-3" />
            <SkeletonLine className="w-2/3 h-8" />
            <SkeletonLine className="w-1/2 h-3" />
        </div>
    );
}

export function SkeletonTableRow({ cols = 6 }) {
    return (
        <tr className="border-b border-pf-border">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-5 py-4">
                    <SkeletonLine className={i === 0 ? 'w-20' : i === cols - 1 ? 'w-16' : 'w-24'} />
                </td>
            ))}
        </tr>
    );
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
    return (
        <table className="pf-table">
            <thead>
                <tr>
                    {Array.from({ length: cols }).map((_, i) => (
                        <th key={i}><SkeletonLine className="w-16 h-3" /></th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <SkeletonTableRow key={i} cols={cols} />
                ))}
            </tbody>
        </table>
    );
}
