# FHEVM 加密问卷调查 dApp 需求文档

## 项目概述

**项目名称**：FHEVM Survey  
**项目类型**：去中心化加密问卷调查平台  
**核心技术**：FHEVM (Fully Homomorphic Encryption Virtual Machine)  
**目标网络**：Sepolia 测试网（支持本地开发）  
**前端目录名**：`survey-frontend`

---

## 核心价值主张

### 与传统问卷的差异

| 特性 | 传统问卷平台 | 普通区块链投票 | FHEVM Survey |
|-----|------------|-------------|--------------|
| 数据隐私 | ❌ 平台可见所有数据 | ❌ 链上答案公开 | ✅ 全程加密保护 |
| 防止操纵 | ⚠️ 依赖平台诚信 | ✅ 去中心化 | ✅ 去中心化+加密 |
| 实时统计 | ✅ 中心化计算 | ❌ 无法加密统计 | ✅ 同态加密统计 |
| 匿名性 | ⚠️ 伪匿名 | ❌ 地址可追踪 | ✅ 真匿名 |
| 结果可信 | ❌ 平台可篡改 | ✅ 链上透明 | ✅ 链上加密透明 |

---

## 模块架构

### 1. 欢迎页 (Landing Page)

#### 功能点
- [ ] Hero 区域：品牌标语 + 核心价值展示
- [ ] 特性介绍：3-4 个核心优势卡片
- [ ] 快速开始：CTA 按钮（创建问卷/参与调查）
- [ ] 统计数据：问卷总数、参与人次、加密答案数
- [ ] 使用流程：3 步图解（创建→分享→解密）

#### 设计要求
- 响应式布局（移动端/平板/桌面）
- 渐变背景或毛玻璃效果
- 动画效果：滚动视差、淡入动画
- 暗色模式支持

#### 页面路由
- 路径：`/`
- 组件：`app/page.tsx`

---

### 2. 导航栏 (Navigation Bar)

#### 功能点
- [ ] Logo + 应用名称（点击回首页）
- [ ] 主导航链接：
  - 浏览问卷 (`/surveys`)
  - 创建问卷 (`/create`)
  - 我的问卷 (`/my-surveys`)
  - 我的参与 (`/my-participations`)
- [ ] 钱包连接按钮（右侧）
- [ ] 网络状态指示器（Sepolia/Localhost）
- [ ] 移动端：汉堡菜单

#### 响应式行为
- 桌面端：水平导航
- 移动端：折叠菜单 + 底部固定钱包按钮

#### 状态管理
- 未连接：显示 "Connect Wallet"
- 已连接：显示地址缩写（0x1234...5678）+ 余额
- 错误网络：显示警告 + 切换按钮

#### 组件位置
- `components/Navigation.tsx`
- `components/WalletButton.tsx`
- `components/NetworkIndicator.tsx`

---

### 3. 钱包连接模块

#### 支持的钱包
- [x] MetaMask（EIP-6963 标准）
- [ ] WalletConnect（可选扩展）
- [ ] Coinbase Wallet（可选扩展）

#### 核心功能

##### 3.1 钱包连接流程
```
用户点击 Connect 
  ↓
检测可用钱包（EIP-6963）
  ↓
显示钱包列表 Modal
  ↓
用户选择钱包
  ↓
调用 eth_requestAccounts
  ↓
获取地址 + chainId
  ↓
持久化到 localStorage
  ↓
初始化 FHEVM 实例
  ↓
连接成功
```

##### 3.2 自动重连机制
- 读取 `localStorage.wallet.connected`
- 页面加载时静默恢复（仅调用 `eth_accounts`）
- **禁止**在加载时调用 `eth_requestAccounts`
- 地址为空时清理持久化数据

##### 3.3 持久化键值
```typescript
{
  "wallet.connected": "true",
  "wallet.lastConnectorId": "io.metamask",
  "wallet.lastAccounts": "[\"0x123...\"]",
  "wallet.lastChainId": "11155111",
  "fhevm.decryptionSignature.0x123...": "0xabc..."
}
```

##### 3.4 事件监听
- `accountsChanged`：切换账户
- `chainChanged`：切换网络
- `disconnect`：断开连接
- `connect`：重新连接

##### 3.5 网络切换
- 检测当前网络是否为 Sepolia/Localhost
- 不匹配时显示切换提示
- 调用 `wallet_switchEthereumChain`
- 失败时显示手动切换指南

#### UI 组件
- `components/WalletConnectModal.tsx` - 钱包选择弹窗
- `components/WalletInfo.tsx` - 已连接状态展示
- `components/NetworkSwitchPrompt.tsx` - 网络切换提示

#### Hook
- `hooks/useWallet.tsx` - 钱包连接状态管理

---

### 4. 创建问卷模块

#### 4.1 问卷基本信息

##### 表单字段
- [ ] 问卷标题（必填，最多 100 字符）
- [ ] 问卷描述（选填，Markdown 支持，最多 500 字符）
- [ ] 封面图片（选填，IPFS 上传）
- [ ] 开始时间（默认：立即）
- [ ] 截止时间（必填）
- [ ] 最大参与人数（选填，0=不限制）

##### 隐私设置
- [ ] 答案可见性：
  - 仅创建者可见（默认）
  - 截止后公开
  - 参与者可见统计（不可见个人答案）
- [ ] 重复提交：允许/禁止
- [ ] 访问控制：公开/白名单

#### 4.2 题目编辑器

##### 题目类型
1. **单选题**
   - 支持 2-10 个选项
   - 每个选项文本 + 可选图片
   - FHEVM：`euint8` 存储选择（0-9）

2. **多选题**
   - 支持 2-10 个选项
   - 可设置最少/最多选择数
   - FHEVM：`euint32` 位掩码存储（如 `0b1011` 表示选了 1、3、4）

3. **评分题**
   - 1-5 星 或 1-10 分
   - FHEVM：`euint8` 存储评分

4. **量表题**（李克特量表）
   - 非常不同意 - 不同意 - 中立 - 同意 - 非常同意
   - FHEVM：`euint8` 存储（0-4）

##### 题目属性
- [ ] 题目文本（必填，最多 200 字符）
- [ ] 是否必答
- [ ] 显示条件（根据前题答案显示）
- [ ] 选项随机排序

##### 编辑功能
- [ ] 添加题目
- [ ] 删除题目
- [ ] 拖拽排序
- [ ] 复制题目
- [ ] 预览模式

#### 4.3 部署流程

```
用户填写表单
  ↓
前端验证
  ↓
构造 Survey 结构体
  ↓
调用 SurveyFactory.createSurvey()
  ↓
等待交易确认
  ↓
获取新问卷地址
  ↓
生成分享链接
  ↓
跳转到问卷详情页
```

#### 4.4 Gas 优化
- 题目和选项存储在链下（IPFS）
- 链上仅存储 IPFS CID + 加密配置
- 批量部署多个问卷时使用 Factory 模式

#### 页面路由
- 路径：`/create`
- 组件：`app/create/page.tsx`
- 子组件：
  - `components/SurveyForm.tsx`
  - `components/QuestionEditor.tsx`
  - `components/QuestionTypeSelector.tsx`
  - `components/OptionEditor.tsx`

---

### 5. 浏览问卷模块

#### 5.1 问卷列表

##### 显示内容
- 问卷卡片：
  - [ ] 封面图片
  - [ ] 标题
  - [ ] 创建者地址（缩写）
  - [ ] 参与人数（加密，显示为 "🔒 Encrypted"）
  - [ ] 截止时间倒计时
  - [ ] 状态标签：进行中/已结束

##### 筛选与排序
- [ ] 状态筛选：全部/进行中/已结束
- [ ] 排序：最新/最热/即将截止
- [ ] 搜索：按标题搜索

##### 分页
- 每页 12 个问卷
- 无限滚动加载

#### 5.2 问卷详情页

##### 信息展示
- [ ] 问卷基本信息
- [ ] 创建者信息
- [ ] 参与统计（加密状态）
- [ ] 时间信息
- [ ] 分享按钮

##### 操作按钮
- [ ] 开始答题（跳转到答题页）
- [ ] 查看结果（仅创建者或公开后）
- [ ] 分享问卷

#### 页面路由
- 列表：`/surveys`
- 详情：`/surveys/[id]`

---

### 6. 参与调查模块

#### 6.1 答题界面

##### 布局模式
- **单页模式**：所有题目在一页
- **分步模式**：每题一页，带进度条

##### 题目渲染
- 根据题目类型动态渲染组件
- 显示必答标记（*）
- 显示题号和总数（1/10）

##### 输入验证
- 前端验证：必填项、选项数限制
- 实时反馈：错误提示

#### 6.2 加密提交流程

```
用户填写答案（明文）
  ↓
前端验证通过
  ↓
初始化 FHEVM 实例
  ↓
获取合约公钥
  ↓
逐题加密答案
  【euint8/euint32】
  ↓
构造交易数据
  ↓
调用 Survey.submitAnswers()
  ↓
等待交易确认
  ↓
链上同态累加统计
  ↓
提交成功
  ↓
跳转到"感谢页"
```

#### 6.3 技术细节

##### 加密逻辑（前端）
```typescript
// 单选题：选项索引（0-9）
const encryptedAnswer = await fhevm.encrypt8(selectedOptionIndex);

// 多选题：位掩码（如选了 1、3、4 → 0b1010 = 10）
const bitmask = selectedOptions.reduce((acc, idx) => acc | (1 << idx), 0);
const encryptedAnswer = await fhevm.encrypt32(bitmask);

// 评分题：分数（1-5）
const encryptedAnswer = await fhevm.encrypt8(rating);
```

##### 合约接收（Solidity）
```solidity
struct AnswerSubmission {
    uint256 questionId;
    inEuint32 encryptedAnswer;
}

function submitAnswers(
    uint256 surveyId,
    AnswerSubmission[] calldata answers
) external {
    Survey storage survey = surveys[surveyId];
    
    for (uint i = 0; i < answers.length; i++) {
        euint32 answer = FHE.asEuint32(answers[i].encryptedAnswer);
        
        // 存储加密答案
        userAnswers[surveyId][msg.sender][answers[i].questionId] = answer;
        
        // 同态累加统计
        _updateEncryptedStats(surveyId, answers[i].questionId, answer);
        
        // 授权给创建者
        FHE.allow(answer, survey.creator);
    }
    
    // 标记已提交
    hasSubmitted[surveyId][msg.sender] = FHE.asEbool(true);
}
```

#### 6.4 防作弊机制

- [ ] 一人一票：`mapping(address => mapping(uint256 => ebool))`
- [ ] 时间窗口检查：开始时间 < now < 截止时间
- [ ] 白名单验证（如启用）
- [ ] Gas limit 保护（防止恶意大数据）

#### 6.5 感谢页

##### 显示内容
- [ ] 感谢消息
- [ ] 交易哈希（可在区块浏览器查看）
- [ ] 返回首页按钮
- [ ] 查看其他问卷按钮

#### 页面路由
- 答题页：`/surveys/[id]/participate`
- 感谢页：`/surveys/[id]/thankyou`

---

### 7. 我的问卷模块

#### 7.1 问卷列表

##### 显示内容
- 我创建的所有问卷
- 每个问卷显示：
  - [ ] 标题
  - [ ] 状态：草稿/进行中/已结束
  - [ ] 参与人数（加密，需解密查看）
  - [ ] 创建时间
  - [ ] 截止时间

##### 操作按钮
- [ ] 查看详情
- [ ] 查看结果（跳转到解密页）
- [ ] 编辑问卷（仅草稿状态）
- [ ] 分享链接
- [ ] 关闭问卷（提前结束）
- [ ] 导出数据

#### 7.2 筛选与搜索
- [ ] 状态筛选
- [ ] 按创建时间排序
- [ ] 搜索问卷标题

#### 页面路由
- 路径：`/my-surveys`
- 组件：`app/my-surveys/page.tsx`

---

### 8. 我参与的问卷模块

#### 8.1 参与记录列表

##### 显示内容
- 我参与过的所有问卷
- 每个记录显示：
  - [ ] 问卷标题
  - [ ] 提交时间
  - [ ] 问卷状态
  - [ ] 是否可查看结果

##### 操作按钮
- [ ] 查看问卷详情
- [ ] 查看我的答案（解密）
- [ ] 查看统计结果（如允许）

#### 8.2 查看我的答案

##### 解密流程
```
用户点击"查看答案"
  ↓
读取链上加密答案
  ↓
检查访问权限
  ↓
调用 FHE.allow(answer, msg.sender)
  ↓
用户签名解密请求
  ↓
调用 fhevm.userDecrypt()
  ↓
显示明文答案
```

##### 显示格式
- 问题 + 我的答案
- 如果结果已公开，显示统计对比

#### 页面路由
- 路径：`/my-participations`
- 组件：`app/my-participations/page.tsx`
- 详情：`/my-participations/[id]`

---

### 9. 解密问卷统计模块（核心）

#### 9.1 访问权限

##### 权限矩阵
| 角色 | 查看加密统计 | 解密统计 | 解密个人答案 |
|-----|----------|---------|----------|
| 问卷创建者 | ✅ | ✅ 随时 | ✅ 所有人 |
| 参与者 | ✅ | ⚠️ 取决于设置 | ✅ 仅自己 |
| 其他人 | ✅ | ❌ | ❌ |

#### 9.2 解密流程

##### 步骤 1：授权
```solidity
// 创建者调用
function allowResultsDecryption(uint256 surveyId) external {
    require(msg.sender == surveys[surveyId].creator, "Not creator");
    
    Survey storage survey = surveys[surveyId];
    
    for (uint i = 0; i < survey.questions.length; i++) {
        for (uint j = 0; j < survey.questions[i].optionCount; j++) {
            euint32 count = optionCounts[surveyId][i][j];
            FHE.allow(count, msg.sender);
        }
    }
}
```

##### 步骤 2：前端解密
```typescript
async function decryptResults(surveyId: number) {
    const results = [];
    
    for (let questionIdx = 0; questionIdx < questionCount; questionIdx++) {
        const questionResults = [];
        
        for (let optionIdx = 0; optionIdx < optionCount; optionIdx++) {
            // 读取加密计数
            const encryptedCount = await contract.optionCounts(
                surveyId, 
                questionIdx, 
                optionIdx
            );
            
            // 用户签名解密
            const decryptedCount = await fhevm.userDecrypt(
                encryptedCount,
                await signer.getAddress()
            );
            
            questionResults.push({
                option: optionIdx,
                count: Number(decryptedCount),
            });
        }
        
        results.push(questionResults);
    }
    
    return results;
}
```

#### 9.3 数据可视化

##### 图表类型

1. **单选题 - 柱状图**
   - X 轴：选项
   - Y 轴：票数
   - 显示百分比

2. **多选题 - 水平条形图**
   - 每个选项独立统计
   - 可多个选项同时选中

3. **评分题 - 雷达图 / 折线图**
   - 显示分布
   - 计算平均分

4. **量表题 - 堆叠条形图**
   - 显示态度分布
   - 左负右正

##### 图表库
- 使用 Recharts 或 Chart.js
- 响应式设计
- 支持导出图片

##### 统计指标
- [ ] 总参与人数
- [ ] 每个选项的票数 + 百分比
- [ ] 平均分（评分题）
- [ ] 众数（最高票选项）
- [ ] 标准差（可选）

#### 9.4 导出功能

##### 导出格式
- [ ] CSV：原始数据
- [ ] JSON：结构化数据
- [ ] PDF：带图表报告

##### 导出数据内容
```json
{
  "surveyId": 1,
  "title": "用户满意度调查",
  "totalParticipants": 150,
  "exportTime": "2025-01-20T10:30:00Z",
  "results": [
    {
      "questionId": 0,
      "questionText": "您对产品的满意度？",
      "type": "rating",
      "stats": {
        "average": 4.2,
        "distribution": {
          "1": 5,
          "2": 10,
          "3": 30,
          "4": 60,
          "5": 45
        }
      }
    }
  ]
}
```

#### 9.5 实时更新

- 使用事件监听合约 `AnswerSubmitted` 事件
- 自动刷新统计数据
- 显示"新增 X 条回答"提示

#### 页面路由
- 路径：`/surveys/[id]/results`
- 组件：`app/surveys/[id]/results/page.tsx`
- 子组件：
  - `components/ResultsChart.tsx`
  - `components/DecryptButton.tsx`
  - `components/ExportButton.tsx`

---

## 智能合约架构

### 合约结构

```
contracts/
├── SurveyFactory.sol          # 问卷工厂合约
├── Survey.sol                 # 单个问卷逻辑
├── libraries/
│   ├── EncryptedStats.sol     # 加密统计库
│   └── AccessControl.sol      # 权限管理库
└── interfaces/
    └── ISurvey.sol            # 问卷接口
```

### 核心合约：Survey.sol

#### 数据结构

```solidity
struct SurveyMetadata {
    string title;
    string ipfsCID;              // 题目和选项存储在 IPFS
    address creator;
    uint256 startTime;
    uint256 endTime;
    euint32 maxParticipants;
    euint32 currentParticipants;
    bool allowMultipleSubmissions;
    PrivacyLevel privacyLevel;
}

enum PrivacyLevel {
    CreatorOnly,
    PublicAfterEnd,
    ParticipantsCanView
}

struct Question {
    uint8 questionType;          // 0=单选, 1=多选, 2=评分
    uint8 optionCount;
}

// 加密答案存储
mapping(uint256 => mapping(address => mapping(uint256 => euint32))) 
    public userAnswers;

// 加密统计
mapping(uint256 => mapping(uint256 => mapping(uint256 => euint32))) 
    public optionCounts;

// 提交状态
mapping(uint256 => mapping(address => ebool)) public hasSubmitted;
```

#### 核心函数

```solidity
// 提交答案
function submitAnswers(
    uint256 surveyId,
    AnswerSubmission[] calldata answers
) external;

// 授权结果解密
function allowResultsDecryption(uint256 surveyId) external;

// 授权个人答案解密
function allowMyAnswersDecryption(uint256 surveyId) external;

// 关闭问卷
function closeSurvey(uint256 surveyId) external;

// 查询统计（加密）
function getEncryptedStats(
    uint256 surveyId,
    uint256 questionId
) external view returns (euint32[] memory);
```

### 核心合约：SurveyFactory.sol

```solidity
contract SurveyFactory {
    Survey[] public surveys;
    mapping(address => uint256[]) public creatorSurveys;
    
    event SurveyCreated(
        uint256 indexed surveyId,
        address indexed creator,
        string title
    );
    
    function createSurvey(
        SurveyMetadata calldata metadata,
        Question[] calldata questions
    ) external returns (uint256 surveyId);
    
    function getSurveysByCreator(address creator) 
        external 
        view 
        returns (uint256[] memory);
}
```

---

## 前端技术栈

### 框架与库
- **Next.js 15** - React 框架（App Router）
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **ethers.js v6** - 以太坊交互
- **@zama-fhe/relayer-sdk** - FHEVM Relayer（Sepolia）
- **@fhevm/mock-utils** - FHEVM Mock（本地）
- **Recharts** - 图表库
- **react-hook-form** - 表单管理
- **zod** - 数据验证
- **date-fns** - 日期处理

### 目录结构

```
survey-frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 欢迎页
│   ├── providers.tsx             # Context Providers
│   ├── globals.css               # 全局样式
│   ├── surveys/
│   │   ├── page.tsx              # 问卷列表
│   │   └── [id]/
│   │       ├── page.tsx          # 问卷详情
│   │       ├── participate/
│   │       │   └── page.tsx      # 答题页
│   │       ├── results/
│   │       │   └── page.tsx      # 结果页
│   │       └── thankyou/
│   │           └── page.tsx      # 感谢页
│   ├── create/
│   │   └── page.tsx              # 创建问卷
│   ├── my-surveys/
│   │   └── page.tsx              # 我的问卷
│   └── my-participations/
│       ├── page.tsx              # 我的参与
│       └── [id]/
│           └── page.tsx          # 参与详情
│
├── components/                   # React 组件
│   ├── Navigation.tsx            # 导航栏
│   ├── WalletButton.tsx          # 钱包按钮
│   ├── WalletConnectModal.tsx    # 钱包连接弹窗
│   ├── NetworkIndicator.tsx      # 网络指示器
│   ├── SurveyCard.tsx            # 问卷卡片
│   ├── SurveyForm.tsx            # 问卷表单
│   ├── QuestionEditor.tsx        # 题目编辑器
│   ├── QuestionTypeSelector.tsx  # 题目类型选择
│   ├── OptionEditor.tsx          # 选项编辑器
│   ├── AnswerForm.tsx            # 答题表单
│   ├── QuestionRenderer.tsx      # 题目渲染器
│   ├── ResultsChart.tsx          # 结果图表
│   ├── DecryptButton.tsx         # 解密按钮
│   ├── ExportButton.tsx          # 导出按钮
│   └── LoadingSpinner.tsx        # 加载动画
│
├── hooks/                        # 自定义 Hooks
│   ├── useWallet.tsx             # 钱包连接
│   ├── useSurvey.tsx             # 问卷交互
│   ├── useEncryptedSubmit.tsx    # 加密提交
│   ├── useDecrypt.tsx            # 解密逻辑
│   └── metamask/
│       ├── useEip6963.tsx
│       ├── useMetaMaskProvider.tsx
│       └── useMetaMaskEthersSigner.tsx
│
├── fhevm/                        # FHEVM 集成
│   ├── fhevm.ts                  # FHEVM 实例管理
│   ├── loader.ts                 # SDK 动态加载
│   ├── constants.ts              # 常量配置
│   ├── mock/
│   │   └── fhevmMock.ts          # Mock 模式
│   ├── useFhevm.tsx              # FHEVM Hook
│   ├── FhevmDecryptionSignature.ts
│   └── PublicKeyStorage.ts
│
├── abi/                          # 自动生成的 ABI
│   ├── SurveyFactoryABI.ts
│   ├── SurveyFactoryAddresses.ts
│   ├── SurveyABI.ts
│   └── SurveyAddresses.ts
│
├── lib/                          # 工具函数
│   ├── contracts.ts              # 合约实例
│   ├── encryption.ts             # 加密工具
│   ├── validation.ts             # 数据验证
│   └── formatters.ts             # 格式化工具
│
├── types/                        # TypeScript 类型
│   ├── survey.ts
│   ├── question.ts
│   └── answer.ts
│
├── scripts/                      # 构建脚本
│   ├── genabi.mjs                # ABI 生成脚本
│   └── check-node.mjs            # 节点检测脚本
│
├── design-tokens.ts              # 设计系统 tokens
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

---

## 设计系统

### Seed 计算
```
seed = sha256("FHEVMSurvey" + "sepolia" + "202510" + "Survey.sol")
```

### 设计选型（基于 seed）

- **设计体系**：Glassmorphism（毛玻璃效果）
- **色彩方案**：B 组 (Blue/Cyan/Teal) - 专业科技风格
- **排版系统**：Sans-Serif (Inter) - 1.25 倍率
- **布局模式**：Sidebar（左侧导航 + 主内容区，移动端顶部导航）
- **组件风格**：中圆角(8px) + 中阴影 + 细边框(1px)
- **动效时长**：标准 (200ms)

### 颜色系统

```typescript
colors: {
  light: {
    primary: '#3B82F6',        // Blue
    secondary: '#06B6D4',      // Cyan
    accent: '#14B8A6',         // Teal
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  dark: {
    primary: '#60A5FA',
    secondary: '#22D3EE',
    accent: '#2DD4BF',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
  },
}
```

### 响应式断点

```typescript
breakpoints: {
  mobile: '0px',      // < 768px
  tablet: '768px',    // 768px - 1024px
  desktop: '1024px',  // > 1024px
}
```

---

## 开发脚本

### package.json 脚本

```json
{
  "scripts": {
    "dev:mock": "node scripts/check-node.mjs && node scripts/genabi.mjs && next dev",
    "dev": "node scripts/genabi.mjs && next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "genabi": "node scripts/genabi.mjs"
  }
}
```

### 开发流程

#### 本地开发（Mock 模式）
```bash
# 终端 1：启动 Hardhat 节点
cd fhevm-hardhat-template
npx hardhat node

# 终端 2：部署合约
npx hardhat deploy --network localhost

# 终端 3：启动前端
cd survey-frontend
npm run dev:mock
```

#### 测试网开发
```bash
# 部署到 Sepolia
cd fhevm-hardhat-template
npx hardhat deploy --network sepolia

# 启动前端（真实 Relayer）
cd survey-frontend
npm run dev
```

---

## 测试策略

### 合约测试

#### 测试用例覆盖
- [ ] 问卷创建
- [ ] 答案提交（加密）
- [ ] 防重复提交
- [ ] 时间窗口检查
- [ ] 加密统计累加
- [ ] 访问控制
- [ ] 解密授权
- [ ] 边界条件

#### 测试文件
```
test/
├── SurveyFactory.ts           # 工厂合约测试
├── Survey.ts                  # 问卷合约测试（本地）
├── SurveySepolia.ts           # 测试网测试
└── EncryptedStats.ts          # 统计逻辑测试
```

### 前端测试

#### E2E 测试（可选）
- 使用 Playwright 或 Cypress
- 测试完整用户流程

---

## 部署清单

### 环境变量

#### 合约部署（fhevm-hardhat-template/.env）
```bash
SEPOLIA_PRIVATE_KEY=0x...
INFURA_API_KEY=...
# 或
ALCHEMY_API_KEY=...
```

#### 前端（survey-frontend/.env.local）
```bash
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_FACTORY_ADDRESS=0x...  # 部署后填入
```

### 部署步骤

1. 部署合约到 Sepolia
2. 记录合约地址
3. 更新前端 `.env.local`
4. 构建前端：`npm run build`
5. 部署到 Vercel/Netlify

---

## 完成定义（DoD）

### 合约部分
- [x] `npx hardhat compile` 通过
- [x] `npx hardhat test` 全部通过
- [x] 本地部署可执行
- [x] Sepolia 部署可执行
- [x] 使用 FHEVM 原生 API
- [x] 访问控制正确实现

### 前端部分
- [x] `npm run build` 通过
- [x] 所有页面路由正常
- [x] 钱包连接与自动重连
- [x] 加密提交流程打通
- [x] 解密显示流程打通
- [x] 响应式设计
- [x] 暗色模式
- [x] UI 英语-only

### 功能验收
- [x] 创建问卷端到端流程
- [x] 参与调查端到端流程
- [x] 解密统计端到端流程
- [x] 我的问卷列表
- [x] 我的参与列表
- [x] 图表可视化
- [x] 导出功能

---

## 扩展功能（Phase 2）

### 可选增强功能
- [ ] 问卷模板库
- [ ] 题目逻辑跳转
- [ ] NFT 空投激励
- [ ] 问卷市场（付费问卷）
- [ ] 白名单管理界面
- [ ] 实时协作编辑
- [ ] 问卷克隆
- [ ] 数据对比分析
- [ ] 多语言支持（i18n）

---

## 时间规划（参考）

| 阶段 | 任务 | 预计时间 |
|-----|------|---------|
| 1 | 合约开发与测试 | 2-3 天 |
| 2 | 前端基础架构（FHEVM 集成） | 1-2 天 |
| 3 | 欢迎页 + 导航 + 钱包连接 | 1 天 |
| 4 | 创建问卷模块 | 2-3 天 |
| 5 | 参与调查模块 | 1-2 天 |
| 6 | 我的问卷 + 我的参与 | 1 天 |
| 7 | 解密统计与图表 | 2-3 天 |
| 8 | 样式优化与响应式 | 1-2 天 |
| 9 | 测试与修复 | 2 天 |
| **总计** | | **13-19 天** |

---

## 参考资源

### FHEVM 文档
- [FHEVM 官方文档](https://docs.zama.ai/fhevm)
- [Solidity API Reference](mdc:Fhevm0.8_Reference.md)
- [Relayer SDK Guide](https://github.com/zama-fhe/fhevm-relayer-sdk)

### 参考实现
- [frontend/fhevm/internal/fhevm.ts](mdc:frontend/fhevm/internal/fhevm.ts)
- [frontend/hooks/useFHECounter.tsx](mdc:frontend/hooks/useFHECounter.tsx)
- [frontend/components/FHECounterDemo.tsx](mdc:frontend/components/FHECounterDemo.tsx)

---

## 联系与支持

如需技术支持或功能讨论，请查阅：
- FHEVM Discord 社区
- GitHub Issues
- 技术文档

---

**文档版本**：v1.0  
**最后更新**：2025-01-20  
**状态**：待开发

