# Issue #5 Analysis: 开发运营端界面

## Parallel Work Streams

This task can be divided into 3 parallel streams:

### Stream A: Rate Configuration Pages
**Agent Type:** frontend-architect
**Scope:**
- Create channel rate viewing page with historical data table
- Create platform markup rate configuration page with form and preview
- Create merchant pricing configuration page with batch and individual settings
- Implement real-time rate calculation preview
- Create configuration change history log viewer
- Mock API hooks for rate configuration

**Files:**
- `frontend/src/pages/operations/ChannelRateViewPage.tsx`
- `frontend/src/pages/operations/PlatformRateConfigPage.tsx`
- `frontend/src/pages/operations/MerchantRateConfigPage.tsx`
- `frontend/src/components/operations/RatePreview.tsx`
- `frontend/src/components/operations/ConfigHistoryLog.tsx`
- `frontend/src/hooks/useRateConfig.ts`
- `frontend/src/mocks/rateConfigApi.ts`

**Estimated:** 1.5-2 days

### Stream B: Order & Merchant Management
**Agent Type:** frontend-architect
**Scope:**
- Create operations order management page with advanced filters and multi-tab view
- Create order detail page with merchant info, order details, channel info, profit info
- Create merchant permission management page for currency pair configuration
- Implement order export functionality
- Mock API hooks for order and merchant management

**Files:**
- `frontend/src/pages/operations/OrderManagementPage.tsx`
- `frontend/src/pages/operations/OrderDetailPage.tsx`
- `frontend/src/pages/operations/MerchantPermissionPage.tsx`
- `frontend/src/components/operations/AdvancedFilters.tsx`
- `frontend/src/components/operations/OrderDetailTabs.tsx`
- `frontend/src/hooks/useOperationsOrders.ts`
- `frontend/src/hooks/useMerchantPermissions.ts`
- `frontend/src/mocks/operationsApi.ts`

**Estimated:** 1.5-2 days

### Stream C: Approval Workflow & Dashboard
**Agent Type:** frontend-architect
**Scope:**
- Create workflow approval page for special rate requests and exceptions
- Integrate with operations management system API
- Create data statistics dashboard with GMV, success rate, profit metrics
- Implement ECharts visualization for dashboard
- Set up dashboard auto-refresh
- Mock API hooks for workflow and analytics

**Files:**
- `frontend/src/pages/operations/ApprovalWorkflowPage.tsx`
- `frontend/src/pages/operations/DashboardPage.tsx`
- `frontend/src/components/operations/ApprovalCard.tsx`
- `frontend/src/components/operations/MetricsChart.tsx`
- `frontend/src/hooks/useWorkflowApproval.ts`
- `frontend/src/hooks/useDashboardMetrics.ts`
- `frontend/src/mocks/workflowApi.ts`
- `frontend/src/mocks/analyticsApi.ts`

**Estimated:** 2-2.5 days

## Coordination Points

### Phase 1: Setup (Day 1)
All streams set up their page structures:
- Stream A: Rate config pages skeleton
- Stream B: Order/merchant management pages skeleton
- Stream C: Approval & dashboard pages skeleton

### Phase 2: Independent Development (Days 2-3)
- Stream A: Rate configuration features with preview
- Stream B: Order management and merchant permissions
- Stream C: Workflow approval and dashboard charts

### Phase 3: Integration (Day 4)
- Integrate shared TanStack Table configuration
- Ensure consistent styling and layout
- Test navigation between pages

### Phase 4: Polish & Testing (Day 5)
- UX refinements
- Loading and error states
- Permission controls
- Final responsive testing

## Success Criteria Mapping

**Stream A:**
- ✅ Channel rate viewing page
- ✅ Platform markup rate config page (form + preview + quick config)
- ✅ Merchant pricing config page (batch + individual pricing)
- ✅ Configuration change history

**Stream B:**
- ✅ Merchant permission management page
- ✅ Operations order management page (advanced filters + multi-tab + export)
- ✅ Order detail page (full info display)

**Stream C:**
- ✅ Workflow approval integration
- ✅ Data statistics dashboard (GMV, success rate, profit)

## Shared Dependencies

All streams will share:
- TanStack Table configuration
- Operations layout and navigation
- Permission checking utilities
- Date range picker components
- Export utilities

**Coordination:** Setup shared utilities in Phase 1, all streams use them.

## Conflict Note

**Conflicts with Issue #4** - These are different portals (merchant vs operations) but may share:
- Some UI components (if using same design system)
- Export utilities
- WebSocket infrastructure

**Resolution:** Issue #4 and #5 should ideally be done by different developers or sequentially. Since they can both run in parallel with backend work using mock data, coordinate on shared component creation.

## Risk Assessment

**Medium Risk** - Multiple complex pages:
- Three streams working on same operations portal
- Potential routing conflicts
- Shared layout changes need coordination

**Merge Strategy:**
- Each stream works on separate page files
- Coordinate on shared component library
- Daily sync on layout and routing changes
- Use feature flags if needed for incomplete features
