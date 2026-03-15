export default function PageHeader({ title, subtitle, children }) {
    return (
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
                <h1 className="font-mono text-xl font-bold text-pf-text">{title}</h1>
                {subtitle && <p className="text-sm text-pf-muted mt-1">{subtitle}</p>}
            </div>
            {children && <div className="flex items-center gap-3">{children}</div>}
        </div>
    );
}
