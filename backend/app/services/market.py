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
