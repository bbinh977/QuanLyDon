# AIGA OS Pro - PRD (Product Requirements Document)

## Original Problem Statement
User uploaded source code of AiGa OS (Google Apps Script + HTML) - a Taobao order management application. User requested building a stronger and more beautiful app based on it.

## Architecture
- **Backend**: FastAPI (Python) + MongoDB
- **Frontend**: React 19 + Tailwind CSS (Dark Theme) + Recharts
- **Authentication**: JWT-based with toggle on/off via Settings
- **AI Integration**: Gemini AI (gemini-2.0-flash-exp)
- **3rd Party API**: Giang Huy Tracking API

## Design Choices
- **Theme**: Dark Elegant (Option 3) + Professional charts with blue gradients (Option 1)
- **Primary colors**: Cyan (#06B6D4), Blue gradient (#3B82F6)
- **Background**: #0F172A (dark slate)
- **Card background**: #1E293B

## User Personas
- Personal Taobao reseller in Vietnam
- Manages orders, customers, finances
- Needs AI-powered business insights
- Tracks shipments via Giang Huy

## Core Requirements (Static)
1. Order management (CRUD + tracking integration)
2. Customer management (CRUD + statistics)
3. Finance tracking (income/expense)
4. Dashboard with charts and stats
5. Giang Huy tracking integration
6. AI Insight with Gemini
7. System configuration
8. Optional authentication

## Implemented Features (Jan 2026)
- ✅ Complete backend API with MongoDB
- ✅ Full authentication system (JWT) with toggle
- ✅ Dark elegant theme with cyan accents
- ✅ Dashboard with revenue chart, status chart, top customers
- ✅ Orders CRUD with status workflow (Chưa mua → Đã mua → Đã giao → Hoàn tất)
- ✅ Orders: **Custom weight fee input** (user can input rounded weight fee, e.g., 20.000đ instead of auto-calculated 16.800đ)
- ✅ Customers CRUD with auto-generated customer codes (KH001, KH002...)
- ✅ Finance CRUD with income/expense tracking
- ✅ Tracking page with Giang Huy API integration (search, sync one, sync all)
- ✅ AI Insight with Gemini (monthly analysis + chat agent)
- ✅ Settings page with API keys management
- ✅ Auto-calculated order fields (profit, price quoted, weight fees)
- ✅ Customer debt and unpaid weight tracking
- ✅ Real-time data updates
- ✅ Responsive design

## API Endpoints
- Auth: /api/auth/register, /api/auth/login, /api/auth/me
- Config: /api/config (GET, PUT)
- Customers: /api/customers (GET, POST, PUT, DELETE)
- Orders: /api/orders (GET, POST, PUT, DELETE) + /api/orders/{id}/complete
- Finance: /api/finance (GET, POST, PUT, DELETE)
- Dashboard: /api/dashboard/stats, /api/dashboard/recent-orders, /api/dashboard/top-customers
- Tracking: /api/tracking/gianghuy/{code}, /api/tracking/sync-order/{id}, /api/tracking/sync-all
- AI: /api/ai/insight, /api/ai/chat

## Database Models
- Users (id, username, email, password, full_name)
- SystemConfig (exchange_rate, weight_rate, salary_*, gemini_api_key, gianghuy_token, require_auth)
- Customer (id, customer_code, full_name, phone, address, facebook_link, notes)
- Order (id, tracking_code, customer_*, weight_kg, product_name, price_yuan/quoted, profit, status, weight_paid, gianghuy_status, notes)
- Finance (id, amount, type, date, notes)

## Backlog / Future Enhancements
- P1: Import data from Google Sheets
- P1: Export reports to Excel/PDF
- P2: Email notifications
- P2: Mobile app
- P2: Multi-user with permissions
- P3: WhatsApp/Telegram integration

## Next Action Items
- User needs to configure Gemini API Key in Settings
- User needs to configure Giang Huy Token in Settings
- Optional: Enable authentication in Settings if multiple users will use
- Test all features thoroughly before production use
