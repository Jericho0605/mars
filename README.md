# DriveWise Database V3

新增独立车辆数据扩充管线，保留现有网站、API 与推荐算法。V3 共 3,710 条 EPA 配置（增加 56 条柴油配置），按 EPA baseModel 去重为 897 个车型年份、356 个跨年份车系；目前仅 12 个车型年份核实零售 Trim，40 条配置达到 Recommendation-Ready，合法同年款照片覆盖 6 个车型年份。**300 个真实 Trim / 授权照片的完整车型目标尚未完成。**

使用 `node scripts/vehicle-data-v3.js build` 构建独立 JSON / CSV，不替换原 API 数据。维护命令、字段约束、来源限制与人工补充流程见 [V3 数据文档](data/v3/README.md)，实际统计见 [覆盖报告](data/coverage-report.md)。

---

# DriveWise V2.1（网站版本与历史记录）

当前版本：四步选择式问卷、前三偏好排序、Top3与更多结果、按车身/价格/性能/能源费用浏览、真实图片与独立来源区域、最多三车对比。主流程只使用确定性规则，无Car DNA或GA。下文旧版本记录仅供历史参考。

完整验收、覆盖率、十组场景与限制见 [V2.1报告](data/v21-report.md)。现有3,654条EPA记录保留，40条厂商补充，其中30条核心价格/座位/动力/货舱齐全。

新增模块：src/enrichment.js（缺失审计与严格重放）、src/image-resolver.js（图片/链接解析）、src/sensitivity.js（十场景反事实分析）；新增scripts/enrich.js、tests/v21.test.js。更新推荐器、server、前端和数据报告。

维护：运行 node scripts/enrich.js 生成缺失队列；node scripts/enrich.js reviewed-batch.json 校验导入官方证据JSON。字段与身份格式参考data/honda-expanded-batch.json。不会自动抓取不明来源，也不按车型名推断参数。旧create-curated-supplements.js只生成初始22条，不能用它覆盖当前完整补充文件。

启动：node src/cli.js build，然后 node src/server.js，打开 http://127.0.0.1:3000 。测试：node --test --experimental-test-isolation=none。

---

# DriveWise · Website V2

当前网站为面向用户的 V2：独立首页、七步问卷、结果页和最多三车并排比较。主推荐 API 仅调用确定性规则引擎，**不调用 Car DNA、遗传算法或虚拟理想车型**。下文 Phase 2 与后续章节保留为历史实现记录，不代表 V2 当前界面。

## V2 主要修改

- 新增 src/recommend-v2.js 与 tests/recommend-v2.test.js；重建 web/index.html、web/style.css、web/app.js；src/server.js 的 POST /api/recommend 切换至 V2。
- 保留 EPA 下载/缓存、数据验证、字段来源、厂商补充、profile/cost、HTTP 与路线服务、车辆媒体资源和全部旧测试。旧 recommend.js 仅保留供历史接口导入与回归，不在网站主推荐链路执行。
- 首页使用代码绘制的通用车身示意图，不将既有跨年份参考图冒充准确配置照片。桌面三列结果，窄屏单列；对比表在窄屏可横向滚动。
- 问卷支持多选车身/动力、严格预算/类型、通勤里程、空间、充电、前三偏好和可选高级硬限制；结果允许编辑、重新计算、查看来源与评分。数据在页面会话内保留，不写入永久存储。

## V2 规则与评分

所有 3,654 条记录先验证硬条件。预算默认严格，座位、明确填写的高级条件始终严格；动力类型默认严格，车身默认软偏好。未知参数无法证明达标。软条件差距只进入单独替代区，不能挤进已确认推荐。

七维为购价、年度能源费用、动力、实用性、续航/补能、安全、尾气排放。基础权重各 1，前三优先项对应维度各加 4 后归一化；低费用与能源效率共享一个维度，避免重复计分。高级设置可覆盖权重。价格/费用/加速用递减曲线，马力接近目标最好，座位/货舱/续航达到目标后封顶。环境仅为 EPA 尾气指标。安全与舒适缺乏证据时不产生虚假分数。

缺失维度为 null，显示分数只基于已知维度重新归一化。排序为已知分 × 有证据的权重覆盖率 − 每项软偏好差距 4 分；全候选池无数据维度从覆盖分母排除并明确提示。按车系去重、优先不同品牌，不强行凑足三辆。同输入同数据库排序固定，分数不是概率。

## V2 验收与限制

57 项测试通过，含学生、七座家庭、性能爱好者、EV 通勤和无匹配五个场景，以及确定性、真实来源、硬筛选、null、里程/费率、权重变化、车系去重和 HTTP。浏览器实际走通七步问卷、结果及两车并排比较。CSS 包含 850px/580px 响应断点；当前浏览器工具不提供设备尺寸模拟，未声称已做真实手机设备验收。

数据未重下载、未改写：3,654 条 EPA 配置，22 条厂商核对配置/7 个车系。MSRP 和座位各 0.60%，马力 0.49%，扭矩 0.16%，货舱和长宽高各 0.33%。本轮未新增车辆参数。七座或最低 250 hp 等严格条件可能无结果，因为已有补充数据无法支持；这不意味着市场上不存在合适车辆。

尚未支持：二手估价、实时库存/报价、完整安全/舒适/拖曳参数、工作充电独立费率、真实保险/残值统计。V2 用户流程不包含地图或 GA。历史路线 API 和 TCO 计算模块保留，V2 显示可验证的年度能源估算，不自动填入未知持有费用。

启动：Node.js 22+，运行 node src/cli.js build，再运行 node src/server.js，访问 http://127.0.0.1:3000 。测试命令 node --test --experimental-test-isolation=none。

---

# DriveWise · Phase 2

基于 Phase 1 继续扩展，无新增运行时依赖。保留 2024–2026 年 **3,654 条 EPA 配置**（Gas 1,960 / HEV 659 / PHEV 122 / EV 913）。新增厂商规格、驾驶需求、能源费与情景 TCO、可复现 Car DNA、前端迭代图、可选在线道路路线。当前仓库仍是独立原型，未接入仓库之外的原始 DriveWise 应用。

## 启动与验证

需要 Node.js 22+。本机无 npm，直接运行：

```powershell
node --test --experimental-test-isolation=none
node src/cli.js build
node src/server.js
```

打开 [本地应用](http://127.0.0.1:3000)。已提供离线数据库，测试、构建、推荐、费用和 DNA 曲线均无需联网。路线查询及官方来源链接需要联网。标准 Node 环境也可 `npm test`、`npm run build`、`npm start`。设置环境变量 `PORT` 可改变端口。

## 已补充的数据

**22 条不同 EPA ID 配置，来自 7 个车型家族**：Prius、Prius Prime/PHEV、LEAF、Corolla Hatchback、Corolla、Maverick、Corolla Cross。包括不同年份、Trim、驱动形式；不是 22 个不同车系。覆盖 Sedan、SUV、Hatchback、Pickup 和四类动力。

|字段|已补充配置数|全库覆盖率|22 条精选覆盖率|
|---|---:|---:|---:|
|MSRP|22|0.60%|100%|
|座位|22|0.60%|100%|
|马力|18|0.49%|81.8%|
|扭矩|6|0.16%|27.3%|
|后备箱|12|0.33%|54.5%|
|长、宽、高、轴距（每字段）|12|0.33%|54.5%|

马力区分发动机、单电机与混动系统综合输出。没有把 Prius 发动机扭矩误当作混动系统扭矩。英寸 ×25.4 → mm，cu ft ×28.316846592 → L，lb-ft ×1.3558179483 → Nm；保留转换说明和字段级出处。

**MSRP 是指定 Trim 的历史官方 base MSRP，不是当前成交价或仍有新车库存的承诺。** 不含目的地费、税费与选装；部分 Toyota 官方资料仅能通过已索引页面读取，实时页面返回维护或 403，未绕过限制。不同发布日期的价格可能不同；source 中保留访问方式与未知 effectiveDate。当前不会根据起步价自动填充整个车系。22 条以外的 3,632 条仍缺少 MSRP/座位。

详细逐车表见 [data/completeness.md](data/completeness.md)，机器报告见 [data/coverage.json](data/coverage.json)。缺失数包含不适用字段；前端同时显示加权 DNA 证据覆盖率和全部字段已知比例，两者含义不同。

## 官方来源

- [EPA CSV](https://www.fueleconomy.gov/feg/epadata/vehicles.csv) / [字段定义](https://www.fueleconomy.gov/feg/ws/index.shtml)：品牌、车型、年份、发动机排量、驱动、变速箱、MPG、MPGe、电耗、电动续航及尾气 CO₂。EV 的 comb08 为 MPGe；PHEV 使用 combA08 与 rangeA。零尾气排放是真实有效的 0，未知仍为 null。
- [2024 Prius 官方电子手册](https://www.toyota.com/content/dam/toyota/brochures/pdf/2024/prius_ebrochure.pdf)、[2024 Prius Prime 官方手册](https://www.toyota.com/content/dam/toyota/brochures/pdf/2024/priusprime_ebrochure.pdf)、[2025 Corolla Hatchback 官方手册](https://www.toyota.com/content/dam/toyota/brochures/pdf/2025/corolla-hb-ebro.pdf)：对应年份/配置的动力、尺寸、空间和容量。
- [2025 Prius](https://www.buyatoyota.com/home/vehicles/prius/2025/)、[2025 Prius PHEV](https://www.buyatoyota.com/home/vehicles/priuspluginhybrid/2025/)、[2025 Corolla](https://www.buyatoyota.com/home/vehicles/corolla/2025/)、[2025 Corolla Cross](https://www.buyatoyota.com/home/vehicles/corollacross/2025/) 等 Toyota 官方页：MSRP、座位及部分动力参数。完整 URL 和证据位置在补充 JSON 中。
- [2024 LEAF](https://usa.nissannews.com/en-US/releases/2024-nissan-leaf-press-kit) / [2025 LEAF](https://usa.nissannews.com/en-US/releases/2025-nissan-leaf-press-kit)：按 S 与 SV PLUS 区分价格、座位、马力、扭矩、电池与空间。没有导入资料中的电机 kW 矛盾值，亦未把“充到 80%”时间填入“10–80%”字段。
- [2025 Maverick 官方发布](https://www.fromtheroad.ford.com/us/en/articles/2024/hybrid-meets-all-wheel-drive-on-new-tech-packed-2025-ford-maveri) / 对应车型表：XL FWD Hybrid 的发布价、座位与离地间隙。
- NHTSA：保留 `src/nhtsa.js` 的缓存车型名称验证器；本次未导入 NHTSA 规格或碰撞评分，不能声称已有安全评分覆盖。

厂商旧手册的 PHEV 续航有时与现有 EPA 更新值不同；统一保留当前导入的 EPA 续航，未混写旧值。

## 数据更新与扩展

```powershell
node src/cli.js import 2024 2026 --refresh
node --test --experimental-test-isolation=none
node src/cli.js build
```

年份可改。无 `--refresh` 时复用 `data/epa.csv`；下载有超时、HTTP/表头检查与临时文件。导入先清洗 EPA，再自动应用 `data/manufacturer-supplements.json` 中该年份范围的补充。若 EPA ID/配置发生变化则拒绝应用，不能模糊合并。新数据库验证成功后替换旧文件；网络失败不清空旧数据。

`--epa-only` 仅生成 EPA 数据（会暂时移除已补充信息）；普通更新不要使用该选项。

补充格式为 JSON 数组：

- `id` 必须对应已有 EPA ID；`match` 完整匹配 year/brand/model/trim/drivetrain/powertrain。
- `epaConfiguration` 另须精确匹配变速箱和发动机描述/ID。
- `retailTrim` 指定人工核对的零售配置；一个 EPA 测试组覆盖多个 Trim 时，明确只选其中一个。原 EPA model、epaTrim 和配置描述保留。Toyota e-AWD 经厂商证据统一为 AWD，原 EPA 4WD 标签保留在 epaDrivetrain，方便正确执行 AWD 筛选。
- `matchEvidence` 说明轮圈、动力、驱动与配置的对应关系。`fieldSources` 每字段提供官方 HTTPS URL、retrievedAt、evidence，可注明页码、列、原单位和换算。
- `specifications` 采用 `src/data.js` 的统一字段。`null` 表示未知。程序验证类型、合理范围与官方域名；**不能代替对官方资料和配置适用性的人工审核**。

审核过的事实生成脚本是 `scripts/create-curated-supplements.js`；只有维护者修改来源事实时才需运行，而且要求输入为原始 EPA 未绑定 Trim 的数据库。日常直接使用已审核 JSON，更新会自动重放。

Phase 1 的通用补充仍可 `--supplement=verified.json`，通过原 `supplement()` 完整身份匹配。绑定后的 Trim 必须匹配实际零售 Trim。CSV 补充尚未实现。

## 用户需求与费用

年度里程 = 单程通勤 ×2×每周往返次数×每年通勤周数 + 其他里程。手动 annualMiles（含 0）优先。未设置时使用可修改的 12,000 mi 演示假设；不会声称这是地图测量。身份仅选择预设，标签本身不进入评分。`scenarios.js` 的 A/B/C 输入全部为用户情景，不是虚构车辆规格。

预算、座位、车身、动力、驱动、最低马力、电动续航、最大加速时间、最低空间、离地间隙及安全星级会逐项核对。默认多样化模式不再把所有不达标或数据未知的车辆提前丢弃；保留严格模式与不可放宽条件，具体见下方最新选择策略。未知价格、座位与碰撞评分绝不称作已验证符合要求。

燃油费 = 里程÷MPG×用户油价；设置城市占比时按城市/高速油耗的倒数加权。EV 费用 = 里程÷100×EPA 电耗×电价。家庭/公共充电按用户比例混合；没有家充时绝不套用家庭电价，缺公共电价则保持未知。EPA 墙端电耗不再额外加充电损耗。工作充电只影响主观便利性，需用户在能源价格中反映实际费用；可安装 Level 2 不等于已有桩。

PHEV 必须提供 electricShare，分别计算电动与燃油里程/费用；这是分段近似，尚不模拟 blended 同时用油电、气温或电池衰减。按 MPG 计算的 PHEV 燃油里程部分使用 charge-sustaining 口径。

持有期 TCO = MSRP + 简化购车税 + 购车费用（含目的地费）+ 持有期能源、保险、保养、维修及其他费用 + 充电安装 − 期末残值。**不重复加折旧**。用户可输入费用上下限与残值率范围。未填写任何必要项目时完整 TCO 为 null，单列已知成本小计与缺失项；明确的 0 才按 0 计。非插电车安装费用为不适用的 0。五年字段只在 ownershipYears=5 时输出，其他年限显示实际持有期。

价格是官方数据；保险、残值、维修及税率等是**用户情景假设**，不是真实车型统计或报价。未模拟补贴、融资和详细地方税法。`confidence` 只有 incomplete 或 user-scenario-only，不给出虚假统计置信度。

## Car DNA

`recommend(vehicles, profile)`、`energyCost(vehicle, profile)`、`ownershipCost(vehicle, profile)` 可直接导入。8 组偏好权重归一化，分配到 13 个归一特征：价格、马力、扭矩、加速、能耗、电动续航、座位、货舱、车长、TCO、补能便利性、尾气 CO₂、安全评级。维度使用固定公开的缩放上限，均在 `recommend.js` 中定义，不直接累加不同单位。

GA 默认 40 个个体、40 代，固定种子（42）：随机初始化、适应度、锦标赛选择、均匀交叉、变异、精英保留和代数停止。它在抽象参数空间里逼近用户目标，**不保证组合物理可实现**。虚拟理想 DNA 从不混入真实数据库。每代最佳/平均 fitness 实际记录供曲线使用。该原型尚未用真实购车反馈标定质量或证明 GA 优于其他排序方法。

实际车匹配按已知特征与理想需求的效用差异加权：座位/空间/续航满足需求后收益饱和，马力围绕目标而非无限越大越好，价格/TCO 更低不受惩罚。缺失维度跳过并重新归一，明确报告证据覆盖率，因此缺少数据的高分不等于高置信。Gas/HEV 的电动续航为不适用，不进入缺失或评分分母。费用不完整则跳过 TCO 特征。补能便利性 0–1 是家充/工作/公共条件的启发式假设。尾气 CO₂ 仅是 EPA 测试排放，不是用户实际排放、发电排放或全生命周期结论。

前端展示 Top 3、成本区间、优缺点、规格来源与缺失、虚拟/真实比较、迭代曲线。拖动权重停止约 180ms 后自动重新计算，也可点击按钮。没有使用固定假曲线。

## HTTP 与地理位置

- `GET /api/health`：数据条数。
- `POST /api/recommend`：与 JS 接口相同的用户 JSON；返回 Top 3、过滤计数、不完整记录、费用、归一权重、DNA 与每代 fitness。
- `POST /api/route`：`{"origin":[lon,lat],"destination":[lon,lat],"consent":true}`。只有明确勾选发送许可才请求第三方 [OSRM Route API](https://project-osrm.org/docs/v5.24.0/api/)，返回道路距离、静态时间和真实路线几何；页面绘制路线形状，**不是地图底图**。失败时返回错误，保留手动通勤距离，不用直线距离冒充路线。

路线在本机不保存、不缓存、不写日志；数据会由 OSRM 公共演示服务器按其服务政策处理。大致居住/工作区域仅留在页面；推荐在浏览器本地运行，默认不发送地址。页面不请求定位权限。服务只绑定 127.0.0.1，限制请求大小，拒绝跨来源 POST；没有 API Key。

已用 OSRM 文档公开 Berlin 示例坐标做在线联通测试（约 1.17 mi，4.34 min）；这不是用户位置或实时交通结果。自动化路线测试使用明确的 mock，断网也能跑。

## 模块与验收

新增：`manufacturer.js`、`coverage.js`、`profile.js`、`cost.js`、`routing.js`、`scenarios.js`、制造商 JSON、来源生成脚本、完整度报告、`phase2.test.js` 与前端样式。扩展现有 `data.js`、`cli.js`、`recommend.js`、`server.js`、`web/index.html`、`web/app.js`。

初次 Phase 2 验收时 **33 项自动化测试通过**，覆盖 EPA、配置隔离、厂商补充、来源、单位、缺失、硬筛选、三种动力成本、TCO、GA/权重、三个场景、HTTP 与路线错误。构建成功；浏览器验证 A/B/C 可切换、页面成功显示结果和曲线，无 JS 控制台错误。`node scripts/demo.js` 可生成可审查的 `data/demo-results.json`。

## 车辆图片与购车入口

新增 `src/vehicle-media.js`、`data/vehicle-media.json`、`web/images/` 与 `web/media.css`。22 条精选配置覆盖 7 个车型家族参考照片，图片保存在本地供离线演示使用。Nissan/Ford 使用官方媒体图；Toyota 官方图片返回 403 后改用 Wikimedia Commons 授权照片，页面展示作者、来源和 CC 许可证链接。图片保持原样，页面以适配容器的方式展示。

图片明确标记参考年款，配置、颜色或市场版本可能不同；Corolla Hatchback 当前为 2022 年款参考图，不冒充 2025 年款实车。没有核实照片的其他车型显示占位说明，不生成虚假实拍图。

推荐卡片新增官方库存入口（Toyota、Nissan、Ford Maverick）与携带年份、车型、Trim、驱动形式的在售搜索链接。官方入口不保证已限定推荐年份或仍有库存，需要用户在目标站点核对；无 affiliate 参数，不执行任何交易。购车网站需要联网。

维护者可运行 `node scripts/fetch-vehicle-media.js` 更新照片及授权元数据；遇到 HTTP 429 应停止并稍后重试，不能绕过服务限制。新增 4 项照片映射、授权、链接及静态资源测试，加上原测试共 37 项。

## 最新选择策略：不同车系与近似推荐

默认 `recommendationMode: "balanced"`。先评估所有真实车辆的已知参数匹配，再核对条件，区分 `verified`（已验证全部达标）、`near`（有已知小幅差距）、`unverified`（必要数据待核实）和 `comparison`（已知差距较大，仅供比较）。每条结果包含 `constraintGaps`，列出要求、实际值、未知项与超出/不足数量。未知不填 0，不推测价格或座位，也不声称符合预算。

排名综合已知 DNA 分数、数据覆盖、未知项及已知差距惩罚，不再给已验证记录固定加分；用户偏好通过分组权重直接影响排序。主推荐从每个品牌中优先取最佳不同车系，再按需补其他车系；同一车系的年份、驱动、轮圈和 Trim 不重复占据 Top 3。当前默认 A/B/C 场景均为三个不同品牌。主要车型家族有明确归并规则，其余使用保守名称标准化，不声称已经解决全库所有车系别名。

另外返回最多 3 条 `alternatives`，提供近似或待核实选择，也按品牌和车系去重。例如学生场景会列出超预算的 Prius XLE、LEAF SV PLUS，以及价格/座位待核实的其他品牌。API 另保留 `verifiedRecommendations`，方便只展示已验证车型。

这是明确的推荐策略变更：普通预算、座位等输入在默认模式中为优先要求，可展示有差距的比较选项。`recommendationMode: "strict"` 恢复全部条件严格筛选。`nonNegotiable: ["budgetUsd", "minSeats"]` 可只锁定部分条件；前端提供预算和座位两个勾选框。`willingEv: false` 始终排除 EV，不自动放宽。

三个不同品牌的保证以允许比较的真实候选池至少有三个品牌为前提。若不可放宽条件只剩一个品牌/不足三种车型，返回实际可用数量与 `diversity.shortfall`，不重复车系或编造第三辆。为了提供比较，默认模式可能展示低匹配或差距较大车型，但会显式标为“仅供比较”，不冒充高匹配达标推荐。数值差距大于 25% 的分级阈值、缺失惩罚及多样性优先均为可审查的原型启发式，不是车型事实。

新增 `src/selection.js`、`web/selection.css`、`tests/selection.test.js`；更新推荐器、API 静态模块路由和前端。多样性策略实现时累计 **44 项测试通过**，包括默认三品牌、车系去重、真实差距、数据未知、严格/不可放宽条件和确定性。

## 后续扩展

### 权重响应修正

权重滑块现在在停止拖动约 180ms 后自动重算，无需再次点击按钮。页面显示实际归一化生效比例；若整组偏好没有任何候选数据（目前安全评级），该组会明确提示并从评分权重中移除，不能以虚假分数制造排名变化。

移除了固定 20 分达标加分，约束差距仍保留独立惩罚，严格/不可放宽条件保持不变。以需求尺度为基准的平滑效用取代原来过早封顶的宽尺度减法，避免多数车型都得到接近 100% 的相同分值。成本和能耗越低效用越高；空间与续航递减收益；动力围绕需求目标。没有手动设置动力/货舱目标时，较高相关权重会相应提高默认需求目标；手动目标优先。

排序按组汇总实际已知证据后应用用户权重。个别车辆缺少某组数据时，该组实际值/分数仍为 null；仅在排序内部用 0.35 的保守先验和覆盖率惩罚处理不确定性，不把缺失当作车型参数或真实低分。页面已知参数 DNA 分与内部排序分用途不同，不能视为概率。

新增 4 项权重回归测试，覆盖七个有数据的滑块从 0 到 10 的真实全库 Top 3 响应、安全无数据的诚实提示、仅选择无数据维度以及缺失参数不被推算。共 48 项测试。

- 全量 3,654 条的厂商补齐、自动制造商抓取与 CSV 补充。
- NHTSA/IIHS 安全评分、可靠性及完整保修数据。不能声称现有推荐具有安全评级优势。
- 交互地图底图、地址地理编码、常去地点与多段路线、沿路充电/加油站、绕路距离、实时空闲。
- 各车型真实保险/维修/残值统计、实时成交价、二手估价、贷款/补贴与详细地方税。
- 完整充电规划、气候/拥堵/电池衰减模拟、发电与制造生命周期环境影响、推荐质量实证标定。

## 本轮 Phase 2 验收（2026-10-16）

新增推荐卡片可展开的持有期费用明细：购价、税费、购入费用、能源、保险、保养、维修、其他费用、安装费和转售抵扣；列出年度燃油/电力及电价假设。未知费用明确保留未知，已知支出小计不冒充完整 TCO 或成本下限。新增一项成本区间核对回归测试。本轮修改 web/app.js、tests/phase2.test.js 与 README；刷新 coverage.json、completeness.md 和 verification.json，并保存 tco-breakdown-preview.png。没有新增车辆参数或车型，既有厂商补充仍为 22 条 EPA 配置（7 个车型家族），不能称作 22 个不同车系。

全库 3,654 条；MSRP/座位各 22 条（0.60%），马力 18 条（0.49%），扭矩 6 条（0.16%），货舱及长宽高各 12 条（0.33%）。价格、座位及补充性能参数来自 Toyota、Nissan、Ford 官方来源；能耗、续航、配置身份与尾气数据来自 EPA。NHTSA 尚无参数补齐。全量缺失明细与逐配置来源见 data/completeness.md、data/coverage.json、data/manufacturer-supplements.json。

本轮 49 项测试全部通过，构建成功，HTTP health/recommend 返回成功，前端已打开并展开费用表核对。运行：`node --test --experimental-test-isolation=none`、`node src/cli.js build`、`node src/server.js`，然后访问 http://127.0.0.1:3000 。

仍未完成：交互地图底图、地址解析、常去地点与多段路线、沿途充电/加油站及绕路分析；真实车型保险/维修/残值统计、安全评级及全库制造商参数。现有道路路线为 OSRM 坐标到坐标计算，手动距离仍可用；不能将路线形状画布称为地图。
