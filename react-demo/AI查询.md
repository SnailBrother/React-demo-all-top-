
我的数据库WebWordReports.dbo.WordReportsInformation里面的我要使用的字段如下：
    location VARCHAR(255) NOT NULL,                  -- 房产坐落
    buildingArea DECIMAL(10, 2) NOT NULL,            -- 建筑面积，精度为 10 位数，保留 2 位小数
    interiorArea DECIMAL(10, 2) NOT NULL,            -- 套内面积，精度为 10 位数，保留 2 位小数
    communityName VARCHAR(100) NOT NULL,              -- 小区名称
    totalFloors INT NOT NULL,                          -- 总层数
    floorNumber INT NOT NULL,                          -- 所在楼层
    housePurpose VARCHAR(100) NOT NULL,                -- 房屋用途
    elevator BIT NOT NULL,                             -- 电梯（有、无）
    yearBuilt INT NOT NULL,                            -- 建成年份
    valuationPrice DECIMAL(15, 0) NOT NULL,            -- 评估单价 (没有小数)
    valueDate DATE NOT NULL,                         -- 价值时点
    decorationStatus VARCHAR(500) NOT NULL,            -- 装饰装修
    spaceLayout VARCHAR(100) NOT NULL,                 -- 空间布局

CREATE TABLE RealEstateAISearch.dbo.QuestionType是一个字典意图关键词词典
questionType（问题类型）                      triggerKeyword（触发问题关键字）
comparison                                  "对比", "比较", "哪个贵", "相差", "比……便宜"，"均价"
statistics                                       "房源", "明细", "数据", "统计", "分布", "多少"
trend                                           "趋势", "变化", "最近"
valuation                                     "多少钱", "价值多少", "价值多少钱", "多少元", "多少一平"

其中上面得数据是comparison区域房价对比、statistics提取详细房源、trend价格趋势变化、valuation房屋单价咨询

CREATE TABLE RealEstateAISearch.dbo.SearchKeywords是一个字典用来触发查找的关键字
    searchType                        triggerKeyword                                                     SearchKeyword     
    location,                  -- "坐落", "位于", "涉及", "区 , "县“                                 "渝北",  "九龙坡", "南岸", "巴南"
    buildingArea,            -- "建筑面积", "名义面积", "上证面积"                          "40", "80", "120"
    interiorArea,            -- "套内面积", "使用面积", "实得面积"                          "40", "80", "120"
    communityName,              -- "小区名称", "小区名", "小区"
    totalFloors,                          -- "总楼层", "所有楼层", "一共楼层"                  "1", "2", "3"
    floorNumber,                          -- "所在楼层层", "所在层", "名义层"                 "1", "2", "3"
    housePurpose,                -- "住宅", "办公", "商", "厂房"                                "住宅", "办公", "商", "厂房"
    elevator,                             -- "电梯", "有电梯", "无电梯"                               "True", "False"
    yearBuilt,                            -- "竣工", "建成", "完工"                                      "2001", "2002", "2003"
    valuationPrice,            -- "单价", "市场单价", "元/平方米", "元/㎡"            "10000", "11000", "9000"
    valueDate,                         -- "价值时点", "成交时间", "时间"                "2024年", "2025年", "2026年"
    decorationStatus,            -- "清水", "木地板", "地砖"                                    "清水", "木地板", "地砖"
    spaceLayout,                 -- "室", "卫", "厨"                                                      "两室", "三室", "一室"

我现在要实现得目的效果就是，比如说我在前端输入一个问题，这仅仅是一个例子，
比如说我问：Question：现在渝北区的住宅房屋均价怎么样
实现的效果就是：
第一步判断问题是哪种类型，根据用户的Question整个字段判断LIKE '%RealEstateAISearch.dbo.QuestionType.triggerKeyword%' 比如说对应的有triggerKeyword里面的"均价"，这个时候就会知道客户问的问题是comparison，
第二步判断要查询的关键字，根据用户的Question整个字段判断LIKE '%RealEstateAISearch.dbo.SearchKeywords.triggerKeyword%' 比如说对应的有triggerKeyword 里面的"区"，这个时候就会知道客户问的问题是location，，
第二步判断要查询的关键字，根据用户的Question整个字段判断LIKE '%RealEstateAISearch.dbo.SearchKeywords.SearchKeyword%' 比如说对应的有SearchKeyword 里面的"渝北"，这个时候就会知道客户问的问题是SearchKeyword  LIKE '%渝北%' ，
特别注意的是：
1、后端处理涉及到小区的时候，要从WebWordReports.dbo.WordReportsInformation里面拿取小区名
2、处理valuation 这个问题类型的时候，我要先找有没有有没有关键字，有的话就从小区查找，如果没有就从区域均价作为结果

前端返回我要的结果效果是：
第一种comparison区域房价对比 ：
序号	对比区域	房源数量	平均评估单价	平均建筑面积	平均套内面积	最低单价	最高单价	平均建成年份
1	江北	2	10300	78.89	63.12	9600	11000	2015
2	渝北	6	9378	101.2	82.04	2670	11800	2015
第二种statistics提取详细房源
序号	房产坐落	建筑面积	套内面积	小区名称	总层数	所在楼层	房屋用途	有无电梯	建成年份	评估单价	价值时点	装修状况	空间布局
1	巴南区李家沱融汇大道3号13幢2单元5-2	176.14	0	香缇卡纳	6	5	成套住宅	否	2010	7300	2025-12-26	入户门防盗门，铝合金窗；室内清水	空间布局合理
2	巴南区渝南大道130号2幢3-3	129.33	109.02	宗申·动力城	32	3	成套住宅	是	2011	6800	2025-11-19	入户门防盗门，铝合金窗；室内客厅地面地砖，墙面墙漆，天棚吊顶，卧室地面地砖，墙面墙漆，天棚刷漆，厨卫：地面地砖，墙砖到顶，扣板吊顶	三室两厅两卫一厨
第三种trend价格趋势变化
序号	年月	委托数量	月均评估单价	月均建筑面积	月度最低单价	月度最高单价
1	2026-01	1	4100	100.96	4100	4100
2	2025-12	6	6158	121.39	2400	10050
3	2025-11	11	6723	104.18	943	14900
4	2025-10	4	10300	123.84	8100	12000
5	2025-09	5	9560	196.95	7200	11000
6	2025-08	9	8063	91.89	2670	11800
7	2025-07	2	8650	111.42	4300	13000
第四种valuation房屋单价咨询
• 价格范围：8100 - 8100 元/平米
• 平均价格：8100 元/平米
• 平均面积：66.7 平米
请把完整的后端/api/ai-query给我