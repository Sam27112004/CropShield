from __future__ import annotations


class MarketServiceAdapter:
    async def commodities(self) -> dict[str, object]:
        return {
            "items": [
                {
                    "commodity": "Wheat",
                    "market": "Delhi",
                    "unit": "quintal",
                    "price": 2450.0,
                    "currency": "INR",
                },
                {
                    "commodity": "Rice",
                    "market": "Pune",
                    "unit": "quintal",
                    "price": 2685.0,
                    "currency": "INR",
                },
            ]
        }

    async def trending(self) -> dict[str, object]:
        return {
            "items": [
                {"commodity": "Soybean", "change_percent": 3.8},
                {"commodity": "Cotton", "change_percent": -1.2},
            ]
        }

    async def mandi_data(self) -> dict[str, object]:
        return {
            "items": [
                {
                    "mandi": "Azadpur",
                    "commodity": "Tomato",
                    "min_price": 850.0,
                    "max_price": 1320.0,
                    "modal_price": 1090.0,
                },
                {
                    "mandi": "Nashik",
                    "commodity": "Onion",
                    "min_price": 780.0,
                    "max_price": 1180.0,
                    "modal_price": 1010.0,
                },
            ]
        }

    async def financial_summary(self) -> dict[str, object]:
        estimated_revenue = 185000.0
        estimated_cost = 121500.0
        estimated_profit = estimated_revenue - estimated_cost
        margin = (estimated_profit / estimated_revenue) * 100 if estimated_revenue else 0.0

        recommendation = (
            "Healthy margin detected. Consider partial hedging for high-volatility commodities."
            if margin >= 25
            else "Margin is tight. Optimize input costs and review mandi timing for better exits."
        )

        return {
            "estimated_revenue_inr": round(estimated_revenue, 2),
            "estimated_cost_inr": round(estimated_cost, 2),
            "estimated_profit_inr": round(estimated_profit, 2),
            "margin_percent": round(margin, 2),
            "recommendation": recommendation,
        }
