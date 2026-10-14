import Panel from "../components/Panel/Panel";
import Metric from "../components/Metric/Metric";
import DataTable from "../components/DataTable/DataTable";
import LineChart from "../components/Chart/LineChart";
import SplitBar from "../components/Chart/SplitBar";
import EmptyState from "../components/EmptyState/EmptyState";
import { ADMIN } from "../data/dashboards";
import { formatNumber, formatDay } from "../utils/format";

const VERIFY_TONE = {
  verified: "u-chip--green",
  "in review": "u-chip--amber",
  pending: "",
};

const SEVERITY_TONE = {
  high: "u-chip--rust",
  medium: "u-chip--amber",
  low: "",
};

const FARMER_COLUMNS = [
  { key: "name", label: "Farmer" },
  { key: "farm", label: "Farm" },
  { key: "location", label: "District" },
  { key: "applied", label: "Applied", render: (row) => formatDay(row.applied) },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <span className={`u-chip ${VERIFY_TONE[row.status] ?? ""}`}>{row.status}</span>
    ),
  },
];

const FLAG_COLUMNS = [
  { key: "product", label: "Listing" },
  { key: "farm", label: "Farm" },
  { key: "reason", label: "Raised because" },
  { key: "raised", label: "Raised", render: (row) => formatDay(row.raised) },
  {
    key: "severity",
    label: "Severity",
    render: (row) => (
      <span className={`u-chip ${SEVERITY_TONE[row.severity] ?? ""}`}>{row.severity}</span>
    ),
  },
];

export default function AdminDashboard() {
  /* Static sample data for now; becomes a useAsync(...) call once the
     backend exists. */
  const { stats, growth, categorySplit, pendingFarmers, flaggedListings, activity, reports } =
    ADMIN;

  return (
    <div className="db-stack">
      <section id="db-overview" aria-label="Overview">
        <div className="db-grid db-grid--stats">
          {stats.map((stat) => (
            <Metric key={stat.id} {...stat} />
          ))}
        </div>
      </section>

      <div className="db-grid db-grid--split">
        <Panel
          title="Verified farmers"
          subtitle="Cumulative, April to September 2026"
          action={<span className="u-chip u-chip--green">+24 this month</span>}
        >
          <LineChart
            data={growth}
            formatValue={formatNumber}
            caption="Verified farmers on the platform by month"
          />
        </Panel>

        <Panel title="Listings by category" subtitle="Share of live listings">
          <SplitBar data={categorySplit} />
        </Panel>
      </div>

      <Panel
        id="db-verification"
        title="Farms awaiting verification"
        subtitle="Land records and a field visit are required before a farm can list"
      >
        {pendingFarmers.length === 0 ? (
          <EmptyState
            size="sm"
            title="Nothing in the queue"
            body="New farm applications will appear here as they arrive."
          />
        ) : (
          <DataTable
            columns={FARMER_COLUMNS}
            rows={pendingFarmers}
            caption="Farms awaiting verification"
          />
        )}
      </Panel>

      <Panel
        id="db-flagged"
        title="Flagged listings"
        subtitle="Raised automatically by the pricing and duplication monitors"
      >
        {flaggedListings.length === 0 ? (
          <EmptyState size="sm" title="Nothing flagged" body="Listings that look wrong will show up here." />
        ) : (
          <DataTable
            columns={FLAG_COLUMNS}
            rows={flaggedListings}
            caption="Listings flagged for review"
          />
        )}
      </Panel>

      <div className="db-grid db-grid--split">
        <Panel id="db-reports" title="Reports">
          <ul className="minilist">
            {reports.map((report) => (
              <li key={report.id}>
                <div>
                  <p className="minilist__name">{report.name}</p>
                  <p className="minilist__meta">
                    {report.period} · {report.size}
                  </p>
                </div>
                {/* No download control: the files do not exist yet, and a
                    button that does nothing is worse than no button. */}
                <span className="minilist__count u-chip">Ready</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Activity">
          <ul className="feed">
            {activity.map((item) => (
              <li key={item.id}>
                <span className={`feed__dot feed__dot--${item.kind}`} aria-hidden="true" />
                <div>
                  <p className="feed__text">{item.text}</p>
                  <p className="feed__time">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}