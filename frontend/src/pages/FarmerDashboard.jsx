import { FiPlus, FiShoppingBag, FiUser } from "react-icons/fi";

import Panel from "../components/Panel/Panel";
import Metric from "../components/Metric/Metric";
import Button from "../components/Button/Button";
import ProductCard from "../components/ProductCard/ProductCard";
import DataTable from "../components/DataTable/DataTable";
import BarChart from "../components/Chart/BarChart";
import EmptyState from "../components/EmptyState/EmptyState";
import { FARMER } from "../data/dashboards";
import { formatPrice, formatCompactINR, formatDay } from "../utils/format";

const STATUS_TONE = {
  paid: "u-chip--green",
  confirmed: "u-chip--lime",
  "in transit": "u-chip--amber",
  "awaiting pickup": "",
};

const ORDER_COLUMNS = [
  { key: "id", label: "Order" },
  { key: "buyer", label: "Buyer" },
  { key: "item", label: "Item" },
  { key: "quantity", label: "Quantity" },
  {
    key: "value",
    label: "Value",
    align: "right",
    render: (row) => <span className="u-tnum">{formatPrice(row.value)}</span>,
  },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <span className={`u-chip ${STATUS_TONE[row.status] ?? ""}`}>{row.status}</span>
    ),
  },
  { key: "date", label: "Date", render: (row) => formatDay(row.date) },
];

export default function FarmerDashboard() {
  /* Static sample data for now. When the backend exists, this one line becomes
     a useAsync(...) call and the rest of the page is unchanged. */
  const { stats, sales, listings, orders, activity } = FARMER;

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
          title="Sales this season"
          subtitle="Paid orders by month"
          action={<span className="u-chip u-chip--green">Up 18% on last season</span>}
        >
          <BarChart
            data={sales}
            formatValue={formatCompactINR}
            caption="Monthly paid order value, April to September 2026"
          />
        </Panel>

        <Panel title="Quick actions">
          <div className="quick">
            <Button variant="primary" fullWidth icon={<FiPlus />} iconPosition="start" to="/farmer-dashboard#db-listings">
              Add a product
            </Button>
            <Button variant="secondary" fullWidth icon={<FiShoppingBag />} iconPosition="start" to="/farmer-dashboard#db-orders">
              View orders
            </Button>
            <Button variant="secondary" fullWidth icon={<FiUser />} iconPosition="start" to="/farmer-register">
              Edit farm profile
            </Button>
          </div>
        </Panel>
      </div>

      <Panel
        id="db-listings"
        title="Your live listings"
        subtitle="Visible to buyers right now"
        action={
          <Button size="sm" variant="secondary" icon={<FiPlus />} iconPosition="start" to="/farmer-dashboard#db-listings">
            New listing
          </Button>
        }
      >
        {listings.length === 0 ? (
          <EmptyState
            title="No listings yet"
            body="Post what is ready this week and buyers in your region will see it within the hour."
            action="Add your first product"
            actionTo="/farmer-dashboard#db-listings"
          />
        ) : (
          <div className="strip">
            {listings.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Panel>

      <div className="db-grid db-grid--split">
        <Panel id="db-orders" title="Recent orders">
          {orders.length === 0 ? (
            <EmptyState
              size="sm"
              title="No orders yet"
              body="Orders appear here as buyers confirm them."
            />
          ) : (
            <DataTable
              columns={ORDER_COLUMNS}
              rows={orders}
              caption="Recent orders on your listings"
            />
          )}
        </Panel>

        <Panel id="db-activity" title="Activity">
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