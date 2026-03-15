import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-pf-bg flex items-center justify-center p-8">
                    <div className="glass-card p-10 max-w-lg text-center animate-fade-in">
                        <div className="text-6xl mb-5 opacity-60">⚠️</div>
                        <h1 className="font-mono text-xl font-bold text-pf-text mb-3">Something went wrong</h1>
                        <p className="text-sm text-pf-muted mb-6">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        {this.state.error && (
                            <div className="glass-card-sm rounded-lg p-3 mb-6 text-left">
                                <p className="text-[11px] text-red-400 font-mono break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="pf-btn-primary text-sm"
                        >
                            🔄 Reload Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
