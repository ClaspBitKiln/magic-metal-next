# Supplier Search

POST /api/komtender/supplier-search

Input:

{
  "product": "Лист",
  "grade": "09Г2С",
  "gost": "ГОСТ 19281",
  "size": "10x1500x6000",
  "quantity": 50,
  "unit": "т",
  "destination": "Екатеринбург",
  "targetMargin": 15
}

The endpoint creates exact search queries for:
- manufacturers;
- suppliers;
- warehouses.

It does not invent prices or availability.

Commercial formulas:
- landed cost = purchase price + delivery;
- sale price = landed cost / (1 - margin);
- total profit = (sale price - landed cost) * quantity.

The next implementation step is to connect these queries to an actual web/search provider and store verified supplier offers. Until that is connected, returned supplier entries are search targets, not confirmed suppliers.
