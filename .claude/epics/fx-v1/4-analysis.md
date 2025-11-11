# Issue #4 Analysis: 开发商户端界面

## Parallel Work Streams

This task can be divided into 2 parallel streams:

### Stream A: Exchange Order Page
**Agent Type:** frontend-architect
**Scope:**
- Create exchange order page layout and routing
- Implement currency pair selector component
- Implement amount input with buy/sell bidirectional calculation
- Implement real-time rate display with WebSocket subscription
- Implement 30-second countdown timer for rate lock
- Implement order confirmation flow with 2FA verification
- Create mock API hooks for exchange rates and order creation
- Mobile responsive design for order page

**Files:**
- `frontend/src/pages/merchant/ExchangePage.tsx`
- `frontend/src/components/merchant/CurrencySelector.tsx`
- `frontend/src/components/merchant/AmountCalculator.tsx`
- `frontend/src/components/merchant/RateLockTimer.tsx`
- `frontend/src/hooks/useExchangeRate.ts`
- `frontend/src/hooks/useWebSocket.ts`
- `frontend/src/mocks/exchangeApi.ts`

**Estimated:** 2-3 days

### Stream B: Order Management Pages
**Agent Type:** frontend-architect
**Scope:**
- Create order list page with filtering and pagination
- Implement order status tags and color schemes
- Create order detail drawer component
- Implement order export to Excel functionality
- Set up WebSocket subscription for order status updates
- Create mock API hooks for order queries
- Mobile responsive design for order management
- Implement i18n for Chinese/English language toggle

**Files:**
- `frontend/src/pages/merchant/OrderListPage.tsx`
- `frontend/src/components/merchant/OrderTable.tsx`
- `frontend/src/components/merchant/OrderDetailDrawer.tsx`
- `frontend/src/components/merchant/OrderFilters.tsx`
- `frontend/src/hooks/useOrderList.ts`
- `frontend/src/hooks/useOrderExport.ts`
- `frontend/src/mocks/orderApi.ts`
- `frontend/src/locales/zh-CN.json`
- `frontend/src/locales/en-US.json`

**Estimated:** 2-3 days

## Coordination Points

### Phase 1: Setup (Day 1)
Both streams set up their foundation:
- Stream A: Page structure, routing, basic layout
- Stream B: Page structure, routing, table setup

### Phase 2: Independent Development (Days 2-3)
- Stream A: Core exchange functionality with mock data
- Stream B: Order management with mock data

### Phase 3: Integration (Day 4)
- Both streams integrate shared WebSocket hook
- Test language switching across both pages
- Verify responsive design consistency

### Phase 4: Polish (Day 5)
- UX refinements
- Loading states
- Error handling
- Final responsive testing

## Success Criteria Mapping

**Stream A:**
- ✅ Exchange order page with currency selector, amount input
- ✅ Buy/sell bidirectional calculation
- ✅ Rate display with 30-second countdown
- ✅ Order flow with 2FA
- ✅ WebSocket real-time rate updates
- ✅ Mobile responsive

**Stream B:**
- ✅ Order list page with filters, pagination, status tags
- ✅ Order detail drawer
- ✅ Order export to Excel
- ✅ WebSocket real-time status updates
- ✅ Mobile responsive
- ✅ Chinese/English toggle

## Shared Dependencies

Both streams will share:
- WebSocket hook (`useWebSocket.ts`)
- API client setup
- i18n configuration
- Shoplazza UI component library
- Theme configuration

**Coordination:** Stream A creates initial shared infrastructure, Stream B uses and extends it.

## Risk Assessment

**Low Risk** - These are independent UI pages:
- Separate page files with no overlap
- Shared hooks can be created by Stream A first
- Mock data prevents backend dependencies

**Merge Strategy:**
- Each stream works on separate page directories
- Minor conflicts possible in routing config (easy to resolve)
- Shared hooks committed by Stream A, then pulled by Stream B
