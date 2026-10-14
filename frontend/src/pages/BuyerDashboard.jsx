import { useState } from "react";
import { FiSearch, FiBookmark } from "react-icons/fi";

import Panel from "../components/Panel/Panel";
import Metric from "../components/Metric/Metric";
import Button from "../components/Button/Button";
import ProductCard from "../components/ProductCard/ProductCard";
import DataTable from "../components/DataTable/DataTable";
import EmptyState from "../components/EmptyState/EmptyState";
import { BUYER } from "../data/dashboards";
import { formatPrice, formatDay } from "../utils/format";

const STATUS_TONE = {
  confirmed: "u-chip--lime",
  "in transit": "u-chip--amber",
  "awaiting pickup": "",
};

const ORDER_COLUMNS = [
  { key: "id", label: "Order" },
  { key: "farm", label: "Farm" },
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

export default function BuyerDashboard() {
  /* Static sample data for now; becomes a useAsync(...) call once the
     backend exists. */
  const { stats, recentlyViewed, recommended, orders, connections } = BUYER;

  const [saved, setSaved] = useState(() => new Set());

  const toggleSave = (id) =>
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /* Derived, not stored: the saved panel is whatever on this page is hearted. */
  const savedProducts = [...recentlyViewed, ...recommended].filter((p) => saved.has(p.id));

  return (
    <div className="db-stack">
      <section id="db-overview" aria-label="Overview">
        <div className="db-grid db-grid--stats">
          {stats.map((stat) => (
            <Metric key={stat.id} {...stat} />
          ))}
        </div>
      </section>

      <Panel
        id="db-marketplace"
        title="Recommended for you"
        subtitle="Based on the crops and districts you buy from"
        action={
          <Button size="sm" variant="secondary" icon={<FiSearch />} iconPosition="start" to="/#for-buyers">
            Browse everything
          </Button>
        }
      >
        <div className="strip">
          {recommended.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              saved={saved.has(product.id)}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      </Panel>

      <Panel title="Recently viewed">
        <div className="strip">
          {recentlyViewed.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              saved={saved.has(product.id)}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      </Panel>

      <div className="db-grid db-grid--split">
        <Panel id="db-orders" title="Your orders">
          {orders.length === 0 ? (
            <EmptyState size="sm" title="No orders yet" body="Orders appear here once you confirm a lot." />
          ) : (
            <DataTable columns={ORDER_COLUMNS} rows={orders} caption="Your recent orders" />
          )}
        </Panel>

        <div className="db-stack">
          <Panel id="db-saved" title="Saved listings">
            {savedProducts.length === 0 ? (
              <EmptyState
                size="sm"
                title="Nothing saved yet"
                body="Tap the heart on any listing to keep it here while you decide."
              />
            ) : (
              <ul className="minilist">
                {savedProducts.map((product) => (
                  <li key={product.id}>
                    <span className="minilist__avatar" aria-hidden="true">
                      <FiBookmark />
                    </span>
                    <div>
                      <p className="minilist__name">{product.name}</p>
                      <p className="minilist__meta">{product.farmer.farm}</p>
                    </div>
                    <span className="minilist__count u-tnum">
                      {formatPrice(product.price)}/{product.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel id="db-connections" title="Farms you buy from">
            <ul className="minilist">
              {connections.map((farm) => (
                <li key={farm.id}>
                  <span className="minilist__avatar" aria-hidden="true">
                    {farm.initials}
                  </span>
                  <div>
                    <p className="minilist__name">{farm.name}</p>
                    <p className="minilist__meta">
                      {farm.farm} · {farm.location}
                    </p>
                  </div>
                  <span className="minilist__count">{farm.orders} orders</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}