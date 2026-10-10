import { useState } from "react";
import { FiArrowRight } from "react-icons/fi";

import SectionHeading from "../components/SectionHeading/SectionHeading";
import ProductCard from "../components/ProductCard/ProductCard";
import Button from "../components/Button/Button";
import Reveal from "../components/Reveal/Reveal";
import { BUYER_BENEFITS } from "../data/site";
import { CATEGORIES, byCategory } from "../data/products";
import "./BuyerSection.css";

export default function BuyerSection() {
  const [category, setCategory] = useState("all");
  const [saved, setSaved] = useState(() => new Set());

  const products = byCategory(category);

  const toggleSave = (id) =>
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section className="buyerx u-section" id="for-buyers" aria-labelledby="buyerx-title">
      <div className="u-page">
        <SectionHeading
          id="buyerx-title"
          title="What is ready this week"
          lead="Every lot names the farm that grew it, the district it ships from, and the day it was cut."
          aside={
            <Button to="/buyer-register" variant="secondary" icon={<FiArrowRight />}>
              Join as a buyer
            </Button>
          }
        />

        <div className="buyerx__filters" role="group" aria-label="Filter listings by category">
          {CATEGORIES.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className="buyerx__filter"
              aria-pressed={category === filter.id}
              onClick={() => setCategory(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="buyerx__grid">
          {products.map((product, index) => (
            <Reveal key={product.id} stagger={index % 3} step={80}>
              <ProductCard
                product={product}
                size={index === 0 ? "tall" : "md"}
                saved={saved.has(product.id)}
                onToggleSave={toggleSave}
              />
            </Reveal>
          ))}
        </div>

        <ul className="buyerx__benefits">
          {BUYER_BENEFITS.map((benefit, index) => (
            <Reveal as="li" key={benefit.id} stagger={index} step={70}>
              <strong>{benefit.title}</strong>
              <span>{benefit.body}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}