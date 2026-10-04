import { Skeleton } from 'antd';
import { resolveProviderView } from '../../application/provider-state';
import { useWebAnalytics } from '../../application/use-web-analytics';
import { CHANNEL_LABELS, type RangeQuery } from '../../domain/web-analytics';
import { ProviderSection } from '../components/provider-section';
import { RequestErrorAlert } from '../components/request-error-alert';
import { ShareBars } from '../components/share-bars';

export function SourcesTab({ query }: { query: RangeQuery }) {
  const q = useWebAnalytics('sources', query);
  if (q.isError && !q.data) return <RequestErrorAlert error={q.error} onRetry={() => void q.refetch()} />;
  const view = resolveProviderView({ isPending: q.isPending, result: q.data?.ga4 });

  return (
    <ProviderSection
      source="ga4"
      view={view}
      range={q.data?.ga4?.range}
      onRetry={() => void q.refetch()}
      skeleton={
        <div className="dashboard__chart dashboard__chart--skeleton">
          <Skeleton active paragraph={{ rows: 5 }} title={{ width: 160 }} />
        </div>
      }
    >
      {(d) => (
        <ShareBars
          title="Asal sesi"
          unit="sesi"
          rows={d.channels.map((c) => ({ key: c.channel, label: CHANNEL_LABELS[c.channel], value: c.sessions }))}
        />
      )}
    </ProviderSection>
  );
}
