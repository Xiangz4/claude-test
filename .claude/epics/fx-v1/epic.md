---
name: fx-v1
status: backlog
created: 2025-11-11T15:19:49Z
progress: 0%
prd: .claude/prds/fx-v1.md
github: https://github.com/Xiangz4/claude-test/issues/1
---

# Epic: fx-v1

## Overview

构建一个完整的跨境商户换汇业务系统，实现透明的汇率配置管理、流畅的换汇交易流程和多通道对接能力。系统核心是**三层汇率体系**（通道汇率→平台标价汇率→商户定价汇率）和**端到端的换汇交易流程**（询价→锁定→下单→执行→出款→对账）。

技术方案采用**事件驱动架构**处理换汇交易流程，确保资金安全和数据一致性；使用**定时任务+缓存**优化汇率采集和计算性能；通过**适配器模式**实现多通道统一接入。

## Architecture Decisions

### 1. 微服务架构分层

**决策：将系统拆分为4个核心服务**
- **汇率服务（Rate Service）**：负责汇率采集、计算和配置管理
- **交易服务（Transaction Service）**：负责换汇订单创建、执行和状态管理
- **通道服务（Channel Service）**：负责外部通道对接（PHP、BOCHK、Leptage）
- **账户服务（Account Service）**：复用现有Lazza Account，扩展换汇资金操作

**理由**：
- 汇率采集和计算是高频操作，独立服务便于优化和扩展
- 交易流程涉及多步骤状态机，独立服务便于状态管理和异常处理
- 通道对接逻辑复杂，独立服务便于适配不同通道和故障隔离
- 复用Lazza Account避免重复建设，降低复杂度

### 2. 汇率数据存储策略

**决策：Redis缓存 + PostgreSQL持久化**
- **Redis**：存储最新汇率（TTL 5分钟）和商户报价锁定（TTL 30秒）
- **PostgreSQL**：存储汇率历史记录、配置规则和交易订单

**理由**：
- 汇率查询是高频操作（每次报价都需要），缓存可显著降低数据库压力
- 30秒汇率锁定需要快速读写，Redis性能最优
- 历史数据用于追溯和分析，需要持久化和复杂查询能力

### 3. 换汇交易流程设计

**决策：采用Saga分布式事务模式**
- 使用事件驱动架构，每个步骤发布事件触发下一步骤
- 每个步骤实现幂等性，支持重试和补偿
- 订单状态机管理整个流程的状态变更

**理由**：
- 换汇流程涉及多个系统（Lazza Account、通道、计费中心），需要分布式事务
- 资金安全是第一优先级，Saga模式提供补偿机制保证最终一致性
- 事件驱动便于异步处理和性能优化

### 4. 通道对接适配器模式

**决策：定义统一的通道接口，各通道实现各自的适配器**
```typescript
interface ExchangeChannel {
  getRealTimeRate(currencyPair: string): Promise<Rate>
  createInquiry(request: InquiryRequest): Promise<InquiryResponse>
  executeExchange(order: ExchangeOrder): Promise<ExecutionResult>
  queryOrderStatus(orderId: string): Promise<OrderStatus>
}
```

**理由**：
- PHP、BOCHK、Leptage接口协议不同，适配器模式统一上层业务逻辑
- 便于后续新增通道，只需实现新的适配器即可
- 支持通道故障切换和负载均衡

### 5. 汇率计算引擎设计

**决策：规则引擎 + 表达式解析器**
- 配置规则存储为JSON格式（支持Pips和百分比两种模式）
- 运行时动态计算汇率，不预先计算
- 支持反向币种对自动推算（如USD/HKD → HKD/USD）

**理由**：
- 配置规则可能频繁调整，规则引擎提供灵活性
- 动态计算确保使用最新通道汇率
- 自动推算减少配置工作量和错误

## Technical Approach

### Frontend Components

#### 商户端（Client-Side）

**核心页面**：
1. **换汇下单页**
   - 币种选择器（支持搜索和筛选）
   - 金额输入框（支持双向计算）
   - 实时汇率展示（30秒倒计时）
   - 报价详情卡片（汇率、支付金额、到账金额）
   - 确认下单按钮（触发安全验证）

2. **订单列表页**
   - 订单筛选器（时间、币种、状态）
   - 订单卡片列表（展示关键信息）
   - 订单详情抽屉（完整信息和状态历史）
   - 导出功能（Excel）

**技术选型**：
- **框架**：React + TypeScript（复用现有技术栈）
- **状态管理**：React Query（管理汇率和订单数据）
- **表单处理**：React Hook Form + Zod（校验）
- **UI组件**：复用Shoplazza设计系统组件

**关键交互**：
- WebSocket实时推送汇率更新和订单状态变更
- 倒计时组件显示汇率剩余有效时间
- 乐观更新提升用户体验

#### 运营端（Admin-Side）

**核心页面**：
1. **汇率配置管理**
   - 通道汇率查看（表格展示）
   - 平台标价汇率配置（表单+预览）
   - 商户定价汇率配置（批量配置+单独议价）
   - 配置历史和变更日志

2. **订单管理**
   - 订单列表（高级筛选）
   - 订单详情（多Tab展示）
   - 异常订单处理工单
   - 数据统计看板

**技术选型**：
- **框架**：React + TypeScript
- **表格组件**：TanStack Table（支持复杂筛选和排序）
- **图表组件**：ECharts（数据可视化）

### Backend Services

#### 1. 汇率服务（Rate Service）

**API端点**：
```
GET  /api/v1/rates/channel/:channelId/latest        # 获取最新通道汇率
POST /api/v1/rates/platform/config                  # 配置平台标价汇率
POST /api/v1/rates/merchant/config                  # 配置商户定价汇率
GET  /api/v1/rates/merchant/:merchantId/quote       # 获取商户报价汇率
POST /api/v1/rates/quote/lock                       # 锁定报价30秒
```

**数据模型**：
```typescript
// 通道汇率
interface ChannelRate {
  id: string
  channelId: string         // PHP/BOCHK/Leptage
  currencyPair: string      // USD/HKD
  bidRate: number           // 买价
  askRate: number           // 卖价
  midRate: number           // 中间价
  fetchTime: Date
  validUntil: Date
}

// 平台标价汇率配置
interface PlatformRateConfig {
  id: string
  channelId: string
  currencyPair: string
  markupType: 'pips' | 'percentage'
  buyMarkup: number         // 买价加点
  sellMarkup: number        // 卖价加点
  creator: string
  effectiveTime: Date
  status: 'active' | 'inactive'
}

// 商户定价汇率配置
interface MerchantRateConfig {
  id: string
  merchantId: string
  platformConfigId: string
  currencyPair: string
  markupType: 'pips' | 'percentage'
  buyMarkup: number
  sellMarkup: number
  approvalStatus: 'pending' | 'approved' | 'rejected'
  effectiveTime: Date
}

// 报价锁定
interface QuoteLock {
  quoteId: string
  merchantId: string
  currencyPair: string
  rate: number
  sellAmount: number
  buyAmount: number
  lockedAt: Date
  expiresAt: Date           // lockedAt + 30s
}
```

**核心逻辑**：
1. **汇率采集Cron Job**（每分钟执行）
   - 并发调用PHP、BOCHK、Leptage API获取最新汇率
   - 写入PostgreSQL历史表 + 更新Redis缓存
   - 发布`RateUpdated`事件供其他服务订阅

2. **汇率计算引擎**
   ```typescript
   // 伪代码
   function calculateMerchantRate(
     channelRate: ChannelRate,
     platformConfig: PlatformRateConfig,
     merchantConfig?: MerchantRateConfig
   ): Quote {
     // Step 1: 通道汇率 + 平台加点 = 平台标价汇率
     const platformRate = applyMarkup(channelRate, platformConfig)

     // Step 2: 平台标价汇率 + 商户加点 = 商户定价汇率
     const finalRate = merchantConfig
       ? applyMarkup(platformRate, merchantConfig)
       : platformRate

     // Step 3: 校验汇率不能低于通道汇率（防止亏损）
     if (finalRate < channelRate.askRate) {
       throw new Error('Rate expired')
     }

     return finalRate
   }
   ```

3. **报价锁定机制**
   - 商户确认报价后，在Redis中创建锁定记录（TTL=30s）
   - 下单时校验锁定是否存在且未过期
   - 锁定过期自动清理（Redis TTL机制）

#### 2. 交易服务（Transaction Service）

**API端点**：
```
POST /api/v1/exchange/orders                        # 创建换汇订单
GET  /api/v1/exchange/orders/:orderId               # 查询订单详情
GET  /api/v1/exchange/orders                        # 查询订单列表
POST /api/v1/exchange/orders/:orderId/cancel        # 取消订单
```

**数据模型**：
```typescript
// 换汇订单
interface ExchangeOrder {
  id: string
  merchantId: string
  quoteId: string

  // 计划金额（商户下单时）
  plannedSellCurrency: string
  plannedSellAmount: number
  plannedBuyCurrency: string
  plannedBuyAmount: number
  customerRate: number

  // 实际金额（通道执行后）
  actualSellAmount?: number
  actualBuyAmount?: number
  actualRate?: number

  // 状态
  orderStatus: OrderStatus
  fxStatus: FxStatus
  settlementStatus: SettlementStatus

  // 时间
  orderTime: Date
  executeTime?: Date
  completeTime?: Date

  // 关联ID
  channelInquiryId?: string
  channelOrderId?: string

  // 成本收益
  costAmount?: number
  profitAmount?: number
}

enum OrderStatus {
  QUOTE_LOCKED = 'quote_locked',          // 报价已锁定
  ORDER_CREATED = 'order_created',        // 订单已创建
  FX_INQUIRING = 'fx_inquiring',          // 通道询价中
  FX_EXECUTING = 'fx_executing',          // 换汇执行中
  FX_SUCCESS = 'fx_success',              // 换汇成功
  FX_FAILED = 'fx_failed',                // 换汇失败
  SETTLEMENT_PROCESSING = 'settlement_processing',  // 出款处理中
  SETTLEMENT_SUCCESS = 'settlement_success',        // 出款成功
  SETTLEMENT_FAILED = 'settlement_failed',          // 出款失败
  ORDER_COMPLETED = 'order_completed',    // 订单完成
  ORDER_CLOSED = 'order_closed'           // 订单关闭
}
```

**核心流程（Saga模式）**：
```typescript
// 订单创建流程
async function createExchangeOrder(request: CreateOrderRequest) {
  // Step 1: 校验报价锁定
  const quoteLock = await redis.get(`quote:${request.quoteId}`)
  if (!quoteLock || quoteLock.expiresAt < now()) {
    throw new Error('Quote expired')
  }

  // Step 2: 校验账户余额
  const balance = await accountService.getBalance(
    request.merchantId,
    request.sellCurrency
  )
  if (balance < request.sellAmount) {
    throw new Error('Insufficient balance')
  }

  // Step 3: 创建订单并冻结资金
  const order = await db.transaction(async (tx) => {
    // 创建订单记录
    const order = await tx.exchangeOrders.create({
      status: OrderStatus.ORDER_CREATED,
      ...request
    })

    // 冻结资金（基本户 → 在途户）
    await accountService.freezeFunds(tx, {
      merchantId: request.merchantId,
      currency: request.sellCurrency,
      amount: request.sellAmount,
      reference: order.id
    })

    return order
  })

  // Step 4: 发布订单创建事件
  await eventBus.publish('OrderCreated', order)

  return order
}

// 换汇执行流程（事件驱动）
eventBus.on('OrderCreated', async (order) => {
  try {
    // Step 1: 向通道询价
    const inquiry = await channelService.createInquiry({
      orderId: order.id,
      sellCurrency: order.plannedSellCurrency,
      buyCurrency: order.plannedBuyCurrency,
      buyAmount: order.plannedBuyAmount
    })

    // Step 2: 校验通道汇率
    if (inquiry.rate > order.customerRate) {
      throw new Error('Channel rate too high')
    }

    // Step 3: 调拨资金到通道
    await accountService.transferToChannel({
      merchantId: order.merchantId,
      currency: order.plannedSellCurrency,
      amount: inquiry.sellAmount,  // 实际成本
      reference: order.id
    })

    // Step 4: 执行通道换汇
    const execution = await channelService.executeExchange({
      inquiryId: inquiry.id,
      orderId: order.id
    })

    // Step 5: 更新订单状态
    await updateOrderStatus(order.id, {
      fxStatus: FxStatus.SUCCESS,
      actualSellAmount: execution.sellAmount,
      actualBuyAmount: execution.buyAmount,
      channelOrderId: execution.channelOrderId
    })

    // Step 6: 发布换汇成功事件
    await eventBus.publish('FxSuccess', order)

  } catch (error) {
    // 补偿：解冻资金，关闭订单
    await compensateOrder(order.id, error)
  }
})

// 出款流程
eventBus.on('FxSuccess', async (order) => {
  try {
    // Step 1: 出款到商户账户
    await accountService.settleFunds({
      merchantId: order.merchantId,
      currency: order.plannedBuyCurrency,
      amount: order.actualBuyAmount,
      reference: order.id
    })

    // Step 2: 扣除在途户资金 + 记录收益
    await accountService.recordProfit({
      orderId: order.id,
      costAmount: order.actualSellAmount,
      profitAmount: order.plannedSellAmount - order.actualSellAmount
    })

    // Step 3: 更新订单状态为完成
    await updateOrderStatus(order.id, {
      orderStatus: OrderStatus.ORDER_COMPLETED,
      completeTime: new Date()
    })

    // Step 4: 通知商户
    await notificationService.send(order.merchantId, {
      type: 'ExchangeCompleted',
      orderId: order.id
    })

  } catch (error) {
    // 触发人工工单处理
    await workflowService.createTicket({
      type: 'SettlementFailed',
      orderId: order.id,
      error: error.message
    })
  }
})
```

#### 3. 通道服务（Channel Service）

**通道适配器实现**：
```typescript
// PHP通道适配器
class PHPChannelAdapter implements ExchangeChannel {
  async getRealTimeRate(currencyPair: string): Promise<Rate> {
    const response = await this.httpClient.get('/rates/realtime', {
      params: { currencyPair }
    })
    return this.mapToRate(response.data)
  }

  async createInquiry(request: InquiryRequest): Promise<InquiryResponse> {
    const response = await this.httpClient.post('/fx/inquiry', {
      requestNo: generateRequestNo(),
      memberId: request.merchantId,
      amount: request.buyAmount,
      buyCurrency: request.buyCurrency,
      sellCurrency: request.sellCurrency,
      deliveryDate: getTodayDate(),
      side: 'buy'
    })
    return this.mapToInquiry(response.data)
  }

  async executeExchange(order: ExchangeOrder): Promise<ExecutionResult> {
    const response = await this.httpClient.post('/fx/order', {
      requestNo: generateRequestNo(),
      memberId: order.merchantId,
      inquiryOrderNo: order.channelInquiryId,
      orderModel: 'prefund'  // 实时下单模式
    })
    return this.mapToExecution(response.data)
  }
}

// Leptage通道适配器（数字货币）
class LeptageChannelAdapter implements ExchangeChannel {
  async getRealTimeRate(currencyPair: string): Promise<Rate> {
    const response = await this.httpClient.get('/v1/quote', {
      params: { ccyPair: currencyPair }
    })
    return {
      rate: response.data.rate,
      validUntil: new Date(Date.now() + 300000)  // 5分钟有效
    }
  }

  async executeExchange(order: ExchangeOrder): Promise<ExecutionResult> {
    // 数字货币需要先调拨本金到通道
    await this.transferFundsToChannel(order)

    const response = await this.httpClient.post('/v1/exchange', {
      ccyPair: order.currencyPair,
      priceId: order.channelInquiryId,
      price: order.actualRate,
      sellAmount: order.actualSellAmount,
      reqNo: generateRequestNo()
    })

    return this.mapToExecution(response.data)
  }
}

// 通道管理器（路由和故障切换）
class ChannelManager {
  private adapters: Map<string, ExchangeChannel>

  async executeWithFallback(
    order: ExchangeOrder,
    preferredChannel: string
  ): Promise<ExecutionResult> {
    const adapter = this.adapters.get(preferredChannel)

    try {
      return await adapter.executeExchange(order)
    } catch (error) {
      // 记录失败日志
      logger.error('Channel execution failed', { channel: preferredChannel, error })

      // 如果有备用通道，尝试切换
      const fallbackChannel = this.getFallbackChannel(preferredChannel)
      if (fallbackChannel) {
        return await fallbackChannel.executeExchange(order)
      }

      throw error
    }
  }
}
```

#### 4. 账户服务扩展（基于Lazza Account）

**新增API**：
```
POST /api/v1/accounts/freeze          # 冻结资金（基本户→在途户）
POST /api/v1/accounts/unfreeze        # 解冻资金（在途户→基本户）
POST /api/v1/accounts/transfer        # 划拨资金（平台↔通道）
POST /api/v1/accounts/settle          # 出款（在途户→目标币种基本户）
```

**资金流转图**：
```
商户卖出币种基本户 → 商户卖出币种在途户（冻结）
     ↓
商户在途户 → 通道换汇账户（调拨）
     ↓
通道换汇账户 → 换汇执行 → 通道目标币种账户
     ↓
通道目标币种账户 → 商户买入币种基本户（出款）
     ↓
商户在途户扣减收益部分 → 平台收益账户
```

### Infrastructure

#### 部署架构
- **容器化**：Docker + Kubernetes部署
- **数据库**：PostgreSQL（主从复制）
- **缓存**：Redis Cluster（高可用）
- **消息队列**：RabbitMQ或Kafka（事件总线）
- **API网关**：Kong或Nginx（路由、限流、鉴权）

#### 监控和日志
- **APM**：Datadog或New Relic（性能监控）
- **日志**：ELK Stack（集中式日志）
- **告警**：PagerDuty（关键问题告警）
- **链路追踪**：Jaeger或Zipkin（分布式追踪）

#### 性能优化
- **汇率缓存**：Redis缓存最新汇率，TTL 5分钟
- **数据库索引**：订单表按merchantId、status、createTime建立复合索引
- **读写分离**：查询走从库，写入走主库
- **CDN加速**：静态资源CDN加速

## Implementation Strategy

### Phase 1: 基础设施和汇率采集（2周）
1. 搭建微服务基础框架和数据库
2. 实现通道汇率采集Cron Job（PHP、BOCHK、Leptage）
3. 实现汇率计算引擎和缓存机制
4. 完成平台标价汇率配置功能

### Phase 2: 换汇交易核心流程（3周）
1. 实现商户报价和锁定功能
2. 实现订单创建和资金冻结
3. 实现通道换汇执行（Saga流程）
4. 实现资金出款和收益记录
5. 实现异常处理和补偿机制

### Phase 3: 运营配置和管理功能（2周）
1. 实现商户定价汇率配置
2. 实现商户权限管理
3. 实现订单管理和查询
4. 实现工单审批流程

### Phase 4: 前端界面开发（3周）
1. 商户端换汇下单页
2. 商户端订单列表和详情页
3. 运营端汇率配置页
4. 运营端订单管理页

### Phase 5: 测试和优化（2周）
1. 单元测试和集成测试
2. 性能测试和压力测试
3. 安全测试和渗透测试
4. Bug修复和性能优化

### 风险缓解
- **通道稳定性风险**：实现通道故障切换和降级机制
- **资金安全风险**：严格的事务控制和补偿机制，完整的审计日志
- **性能瓶颈风险**：提前进行压测，准备扩容预案
- **数据一致性风险**：采用Saga模式确保最终一致性

### 测试策略
- **单元测试**：核心业务逻辑100%覆盖率
- **集成测试**：端到端流程测试
- **性能测试**：模拟100 TPS并发换汇
- **混沌测试**：模拟通道故障、网络异常等场景

## Task Breakdown Preview

基于PRD需求和技术方案，将工作拆分为以下**8个高层任务类别**：

- [ ] **Task 1**: 搭建微服务基础架构和数据库模型（汇率服务、交易服务、通道服务的项目框架、数据库表设计、基础中间件配置）
- [ ] **Task 2**: 实现通道汇率采集系统（PHP/BOCHK/Leptage适配器、定时采集Cron、汇率存储和缓存）
- [ ] **Task 3**: 实现汇率计算引擎和配置管理（三层汇率计算逻辑、平台/商户汇率配置API、规则引擎）
- [ ] **Task 4**: 实现换汇交易核心流程（订单创建、Saga事件流、资金冻结/解冻、通道换汇执行、资金出款）
- [ ] **Task 5**: 实现通道服务和资金调拨（PHP/Leptage通道对接、资金调拨逻辑、异常处理和重试）
- [ ] **Task 6**: 开发商户端界面（换汇下单页、订单列表和详情页、WebSocket实时更新）
- [ ] **Task 7**: 开发运营端界面（汇率配置管理页、商户配置页、订单管理页、工单审批流程）
- [ ] **Task 8**: 测试、优化和上线准备（单元/集成/性能测试、监控告警配置、文档编写、灰度发布）

**任务简化说明**：
- 复用Lazza Account现有能力，只扩展换汇资金操作接口，避免重复建设
- 通道适配器模式统一接口，新增通道只需实现适配器
- 前端复用Shoplazza设计系统组件，减少UI开发工作量
- 使用成熟的开源框架（NestJS/React/PostgreSQL/Redis），降低开发复杂度

## Dependencies

### 外部依赖
1. **PHP通道API**（关键依赖）
   - 实时汇率、换汇询价、换汇下单、资金转账
   - 需提前获取API文档和测试环境
   - 依赖方联系人：[待补充]

2. **BOCHK汇率数据源**（关键依赖）
   - 实时汇率API：https://mds1a.trkdhs.com/bochkfxibs/mktinfo
   - 只读接口，无需对接联调

3. **Leptage数字货币通道**（一般依赖）
   - 询价、换汇、资金转账API
   - 需提前获取API文档和测试账号

### 内部依赖
1. **Lazza Account系统**（关键依赖）
   - 需扩展API：资金冻结、解冻、划拨、出款
   - 需协调Lazza Account团队开发扩展接口
   - 预计需要2周开发时间

2. **计费中心**（一般依赖）
   - 汇率计算引擎、手续费计算、收益计算
   - 可能需要扩展或复用现有能力

3. **运营管理系统**（一般依赖）
   - 工单审批流程、权限管理
   - 需要对接工单系统API

4. **认证系统**（一般依赖）
   - 商户登录、2FA验证
   - 复用现有能力

### 前置工作
- **Week 1**: 与Lazza Account团队对齐API扩展需求
- **Week 1**: 申请PHP和Leptage通道测试环境和API文档
- **Week 2**: 完成技术方案评审和数据库设计评审

## Success Criteria (Technical)

### 性能基准
- ✅ 汇率报价响应时间P95 < 500ms
- ✅ 换汇下单响应时间P95 < 2s
- ✅ 系统支持100+ TPS并发换汇订单
- ✅ 汇率采集成功率 > 99.9%
- ✅ 通道API调用成功率 > 99.9%

### 质量门禁
- ✅ 单元测试覆盖率 > 80%
- ✅ 关键路径集成测试通过率100%
- ✅ 安全扫描无高危漏洞
- ✅ 性能测试通过（100 TPS持续10分钟）
- ✅ 压力测试通过（200 TPS峰值）

### 验收标准
- ✅ 商户可成功完成端到端换汇流程
- ✅ 财务人员可配置平台标价汇率且实时生效
- ✅ 运营人员可配置商户定价汇率且商户立即看到
- ✅ 异常订单触发工单且资金安全
- ✅ 所有资金操作有完整审计日志
- ✅ 系统7x24小时可用性 > 99.9%

### 数据一致性验证
- ✅ 商户账户余额 = 基本户 + 在途户
- ✅ 平台收益 = Σ(商户支付 - 通道成本)
- ✅ 订单状态流转符合状态机定义
- ✅ 资金冻结/解冻操作幂等性

## Estimated Effort

### 整体时间线
- **总计**：12周（约3个月）
- **Phase 1**：2周（基础设施和汇率采集）
- **Phase 2**：3周（换汇交易核心流程）
- **Phase 3**：2周（运营配置和管理）
- **Phase 4**：3周（前端界面开发）
- **Phase 5**：2周（测试和优化）

### 资源需求
- **后端工程师**：3人（汇率服务、交易服务、通道服务各1人）
- **前端工程师**：2人（商户端、运营端各1人）
- **测试工程师**：1人（全职）
- **产品经理**：1人（需求澄清和验收）
- **技术负责人**：1人（架构设计和技术决策）

### 关键路径
```
通道汇率采集 → 汇率计算引擎 → 报价和锁定 → 订单创建 →
换汇执行 → 资金出款 → 前端开发 → 测试 → 上线
```

**关键瓶颈**：
1. Lazza Account API扩展（需要2周，外部依赖）
2. 通道API对接和联调（需要1周，外部依赖）
3. Saga事件流开发和测试（复杂度高，需要2周）

### 风险缓冲
- 预留2周时间作为风险缓冲（处理不可预见问题）
- 如果进度紧张，可以Phase 3和Phase 4并行开发
- 前端可以使用Mock数据提前开发，降低对后端依赖

## Tasks Created

- [ ] #2 - 实现换汇交易核心流程 (parallel: false)
- [ ] #3 - 搭建微服务基础架构和数据库模型 (parallel: true)
- [ ] #4 - 开发商户端界面 (parallel: true)
- [ ] #5 - 开发运营端界面 (parallel: true)
- [ ] #6 - 测试、优化和上线准备 (parallel: false)
- [ ] #7 - 实现通道汇率采集系统 (parallel: false)
- [ ] #8 - 实现通道服务和资金调拨 (parallel: false)
- [ ] #9 - 实现汇率计算引擎和配置管理 (parallel: false)

Total tasks: 8
Parallel tasks: 3
Sequential tasks: 5
Estimated total effort: 26-35 days
