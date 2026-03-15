import { useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';

const TITLES = {
    production: 'Production',
    qse: 'QSE',
    maintenance: 'Maintenance',
    hr: 'HR',
    stores: 'Stores & Shipping',
};

export default function AppHistoryPage() {
    const { appId } = useParams();
    const title = TITLES[appId] || 'App';

    return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <PageHeader title={`${title} History`} subtitle="View and search past entries" />
            <div className="glass-card p-12 text-center">
                <div className="text-5xl mb-4 opacity-30">📋</div>
                <p className="text-pf-muted text-sm">History and past entries will appear here.</p>
                <p className="text-pf-muted text-xs mt-1">Entries are displayed by date, most recent first.</p>
            </div>
        </div>
    );
}
