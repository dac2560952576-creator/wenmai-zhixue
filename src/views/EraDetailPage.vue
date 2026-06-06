<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">{{ eraName }}</h1>
      <span></span>
    </header>

    <div class="page-body" v-if="era">
      <!-- 时代介绍卡片 -->
      <div class="era-hero">
        <div class="era-hero-top">
          <span class="era-hero-name">{{ era.name }}</span>
          <span class="era-hero-period">{{ era.period }}</span>
        </div>
        <div class="era-scroll-box">
          <div
            class="era-scroll-track"
            :style="{
              '--scroll-dist': Math.max(0, (era.context?.length || 1) - 1) * -130 + 'px',
              '--scroll-dur': (era.context?.length || 1) * 12 + 's'
            }"
          >
            <p v-for="(text, i) in era.context" :key="i" class="era-scroll-item">{{ text }}</p>
          </div>
        </div>
      </div>

      <div v-if="eraCrafts.length" class="era-section">
        <h3>🏺 代表工艺</h3>
        <div class="craft-grid">
          <div
            v-for="c in eraCrafts"
            :key="c.id"
            class="craft-item"
            @click="$router.push('/craft/' + c.id)"
          >
            <span class="craft-emoji">{{ c.icon }}</span>
            <div class="craft-info">
              <span class="craft-name">{{ c.name }}</span>
              <span class="craft-detail">{{ c.detail }}</span>
            </div>
            <span class="craft-arrow">›</span>
          </div>
        </div>
      </div>

      <div v-if="eraCourses.length" class="era-section">
        <h3>📹 相关课程</h3>
        <div class="course-list">
          <div
            v-for="c in eraCourses"
            :key="c.id"
            class="course-item"
            @click="activeVideo = c"
          >
            <span class="course-icon">{{ c.icon }}</span>
            <div class="course-text">
              <span class="course-title">{{ c.title }}</span>
              <span class="course-duration">{{ c.duration }}</span>
            </div>
            <span class="course-arrow">▶</span>
          </div>
        </div>
      </div>

      <div v-if="eraDocs.length" class="era-section">
        <h3>📖 知识文档</h3>
        <div class="doc-list">
          <div
            v-for="d in eraDocs"
            :key="d.id"
            class="doc-item"
            @click="$router.push('/craft/' + d.id)"
          >
            <span class="doc-icon">{{ d.icon }}</span>
            <div class="doc-content">
              <span class="doc-name">{{ d.name }}</span>
              <span class="doc-brief">{{ d.brief }}</span>
            </div>
            <span class="doc-arrow">›</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频播放器 -->
    <div class="video-overlay" v-if="activeVideo" @click.self="activeVideo = null">
      <div class="video-card">
        <div class="video-header">
          <h3>{{ activeVideo.title }}</h3>
          <button @click="activeVideo = null">✕</button>
        </div>
        <div class="video-frame">
          <iframe
            v-if="activeVideo.bvid"
            :src="`//player.bilibili.com/player.html?bvid=${activeVideo.bvid}&page=1&autoplay=0`"
            scrolling="no" border="0" frameborder="no" framespacing="0"
            allowfullscreen="true"
            style="width:100%;height:100%;"
          ></iframe>
        </div>
        <p class="video-desc">{{ activeVideo.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeVideo = ref(null)

// ---- 时代完整数据库 ----
const eraDatabase = {
  '新石器': {
    icon: '🧵', period: '约公元前5000—前2000年',
    context: [
      '长江下游的良渚文化遗址（约公元前3300—前2300年）出土了迄今为止世界上最早的丝织物残片——距今约5300年。这些绢片、丝带和丝线经科学鉴定确认为家蚕丝，证明中国是世界上最早养蚕缫丝的国家。',
      '中国之所以能最早掌握丝织技术，首先得益于得天独厚的自然条件：黄河流域和长江流域广泛分布着野生桑树和野蚕，新石器时代的温暖湿润气候为蚕桑提供了理想环境。河姆渡遗址（距今约7000年）已发现蚕纹图案和原始纺织工具，显示丝织技术有漫长的发展前史。',
      '更深层的原因是定居农业文明的成熟。良渚先民已建造了规模宏大的古城和水利系统，稳定的定居生活使长期观察蚕的习性、驯化野蚕成为可能。同时，良渚社会已出现明显的等级分化——贵族阶层对丝绸等奢侈品产生了需求，推动丝织从实用走向礼仪与身份象征。',
      '丝绸在诞生之初就不仅仅是织物，而被赋予了通天、通神的宗教意义。蚕"出生→成长→作茧→羽化"的生命循环被先民视为生死轮回的象征。此后约三千年，中国一直保持着对丝绸生产技术的垄断，直到汉代丝绸之路开通才逐渐向外传播。'
    ],
    crafts: [{ icon: '🧵', id: 'hangzhou-silk', name: '杭州丝绸', detail: '良渚文化丝织物残片——世界最早的丝绸' }]
  },
  '春秋战国': {
    icon: '🪡', period: '约公元前770—前221年',
    context: [
      '春秋战国是中国历史上思想最活跃、文化最繁荣的时期之一。铁器的普及和牛耕的推广大大提高了社会生产力，手工业从农业中分离出来成为独立的生产部门。《周礼·考工记》作为世界上最早的手工艺专著在此时期成书，系统记载了30个工种的技术规范。',
      '刺绣工艺在这一时期迅速发展。锁绣（辫子股针）是最早出现的刺绣针法——用针将丝线挽成环圈，第二个环圈从第一个环圈中穿过，形成如锁链相连的效果。长沙马王堆等战国墓葬中出土了大量精美绣品，纹样以龙凤、花卉、几何图案为主，针法已相当成熟。',
      '刺绣的兴起与列国并立的竞争格局密切相关。各诸侯国以华美的衣冠彰显国力与礼仪之邦的地位，推动了丝织和刺绣技艺的快速发展。齐国的"齐纨"、鲁国的"鲁缟"、楚国的丝织品各具特色，"锦绣"一词自此成为美好事物的代名词。'
    ],
    crafts: [
      { icon: '🧵', id: 'hangzhou-silk', name: '杭州丝绸', detail: '蚕桑丝织技术进一步成熟，成为各国重视的产业' },
      { icon: '🪡', id: 'suxiu', name: '苏绣', detail: '锁绣针法——刺绣最早的技法形态' }
    ]
  },
  '汉代': {
    icon: '🎭', period: '公元前202—公元220年',
    context: [
      '汉代是中国历史上第一个长期大一统的帝国，国力强盛、经济繁荣。张骞出使西域开辟了丝绸之路，中国的丝绸和漆器开始大规模输出到中亚、西亚乃至罗马帝国，形成了连接东西方的贸易网络。手工业在"盐铁官营"的经济政策下获得了官方大力扶持。',
      '蜀绣在汉代已闻名天下。四川成都平原气候温润、桑蚕发达，蜀地工匠将刺绣技艺发挥到极致，蜀绣以色彩明快、针脚平齐为特点，与蜀锦并称"蜀中之宝"。与此同时，皮影戏的雏形在汉代出现——《汉书》记载方士为汉武帝招魂的故事，被视为皮影艺术最早的起源。',
      '汉代手工艺的繁荣得益于几个关键因素：丝绸之路带来的海外需求刺激了生产；铁器的广泛使用改进了工具；"百工"制度的建立使工匠成为专业化群体；儒学"器以载道"的思想赋予工艺美术以文化正当性。工艺从此不仅是"器"，更是"道"的载体。'
    ],
    crafts: [
      { icon: '🪡', id: 'shuxiu', name: '蜀绣', detail: '汉代蜀绣闻名天下，中国四大名绣之一' },
      { icon: '🎭', id: 'shadow-puppet', name: '皮影戏', detail: '皮影戏雏形在汉代出现' }
    ]
  },
  '唐代': {
    icon: '🏺', period: '公元618—907年',
    context: [
      '唐代是中国历史上最强盛的王朝之一，经济繁荣、文化自信、对外开放达到了空前的高度。长安城是当时世界上最大的城市，汇聚了来自波斯、印度、日本等地的商人和使节。唐代手工业分为官营和私营两大体系，官营作坊规模宏大、分工精细。',
      '越窑青瓷在这一时期达到巅峰。浙江上林湖一带的越窑以出产"秘色瓷"闻名，釉色青绿温润如"千峰翠色"，是唐代宫廷和贵族的珍贵用器。同时海上丝绸之路进入鼎盛期——广州、泉州、明州（宁波）等港口商船云集，丝绸和瓷器成为中国对外贸易的核心商品。',
      '唐代工艺繁荣的根本动力来自开放的国策和繁荣的经济。朝廷设立"少府监"专门管理官营手工业，工匠世代传承技艺。同时科举制度培养了大量有文化的士人阶层，他们对工艺品的审美需求推动了技艺的提升。唐诗中大量吟咏瓷器和丝绸的篇章，见证了工艺在唐代文化中的崇高地位。'
    ],
    crafts: [
      { icon: '🏺', id: 'longquan', name: '龙泉青瓷', detail: '越窑青瓷——龙泉窑的源头与前身' },
      { icon: '🧵', id: 'hangzhou-silk', name: '杭州丝绸', detail: '海上丝绸之路的核心商品' }
    ]
  },
  '宋代': {
    icon: '🏺', period: '公元960—1279年',
    context: [
      '南宋定都杭州后，浙江成为全国政治经济文化中心。龙泉青瓷由此进入了空前绝后的鼎盛时期。章生一、章生二兄弟分别创立哥窑（开片冰裂纹）和弟窑（粉青梅子青），将青瓷釉色之美推向极致——粉青如雨过天晴，梅子青如翡翠初熟，至今仍被视为中国青瓷美学的最高峰。',
      '龙泉青瓷的鼎盛并非偶然。靖康之变后北方名窑（汝窑、定窑）相继衰落，大量北方窑工南迁，带来了汝窑和官窑的先进技术。龙泉窑工在石灰釉中掺入"乌釉"，发明了石灰碱釉——这种新釉高温下粘度大、不流釉，可以多次施釉形成厚达1.5毫米的釉层，烧成后产生如美玉般的温润质感。',
      '更深层的驱动力来自南宋的海外贸易国策。偏安江南的南宋朝廷疆域缩小，传统农业税收不足，大力发展海上贸易成为生存之道。朝廷规定外贸"以绢布、瓷器博易"（以货易货），龙泉青瓷从此大量出口。考古发现温州朔门港遗址中龙泉青瓷占比高达90%，证实了这条"陶瓷之路"的空前规模。',
      '宋代文人美学也深刻影响了龙泉青瓷的风格。"尚玉比德"的审美理念——认为君子之德应如美玉般温润含蓄——在青瓷中找到了完美表达。青瓷成为文人"烧香点茶、挂画插花"四般闲事中不可或缺的元素，从日用器升华为精神载体。'
    ],
    crafts: [
      { icon: '🏺', id: 'longquan', name: '龙泉青瓷', detail: '哥窑弟窑，粉青梅子青——青瓷美学的巅峰' },
      { icon: '🫙', id: 'jingdezhen', name: '景德镇瓷器', detail: '青白瓷闻名天下，瓷都从此崛起' },
      { icon: '🧵', id: 'hangzhou-silk', name: '杭州丝绸', detail: '宋锦、缂丝——"一寸缂丝一寸金"' },
      { icon: '🖼️', id: 'nianhua', name: '木版年画', detail: '宋代木版印刷技术推动年画兴起' }
    ]
  },
  '元代': {
    icon: '🫙', period: '公元1271—1368年',
    context: [
      '元朝是蒙古人建立的跨越欧亚的大帝国，其疆域之广前所未有。多元文化在此碰撞融合：波斯的钴料（苏麻离青）传入中国，伊斯兰文化对蓝白配色的偏好影响了中国陶瓷审美——青花瓷由此诞生。以钴料在瓷胎上绘制纹饰后施透明釉，高温一次烧成，蓝白相间、清丽雅致，成为中国瓷器最具世界影响力的品类。',
      '龙泉青瓷在元代并未衰落，反而进入大规模外销的黄金期。元代龙泉窑产量空前，胎体趋于厚重、器型变大，以适应长途海运的需要。龙泉青瓷沿瓯江顺流而下经温州港出口，远销日本、东南亚、印度洋沿岸乃至东非和欧洲，成为真正意义上的全球化商品。',
      '元代的工艺特点是"大而全"——景德镇的青花瓷、龙泉的外销青瓷、新兴的釉里红等品类百花齐放。蒙古统治者重视工匠，在战争中"唯工匠免死"，大量中亚和伊斯兰工匠迁入中国，带来了掐丝珐琅等新技术。多元文化的碰撞融合为明代工艺美术的全面繁荣奠定了基础。'
    ],
    crafts: [
      { icon: '🫙', id: 'jingdezhen', name: '景德镇瓷器', detail: '青花瓷——元代贡献给世界的最伟大发明' },
      { icon: '🏺', id: 'longquan', name: '龙泉青瓷', detail: '元代大规模外销至亚非欧各地' }
    ]
  },
  '明代': {
    icon: '🔔', period: '公元1368—1644年',
    context: [
      '明代是中国传统手工艺的黄金时代。明初洪武、永乐年间社会安定、经济恢复，城市商业繁荣催生了庞大的工艺品消费市场。郑和七下西洋进一步拓展了海外贸易，景泰蓝、青花瓷、紫砂壶等品类远销亚非各国。明代中后期资本主义萌芽的出现使得民营手工业空前活跃。',
      '景泰蓝（铜胎掐丝珐琅）在景泰年间（1450—1457年）达到艺术顶峰。这项技术融合了伊斯兰掐丝珐琅工艺与中国传统审美，以紫铜为胎、细铜丝掐成图案、填入珐琅釉料反复烧制打磨而成，色彩绚丽、富丽堂皇，堪称宫廷工艺的极致代表。',
      '宜兴紫砂壶在明代兴起，得益于几个因素：饮茶方式从宋代的"点茶"转变为明代的"泡茶"，对茶具提出了新的要求；宜兴当地特有的紫砂泥料含铁量高、可塑性好；文人参与壶型设计，将书画篆刻融入紫砂艺术，使一把壶同时成为实用器与艺术品。东阳木雕和潍坊风筝也在这一时期走向成熟。'
    ],
    crafts: [
      { icon: '🔔', id: 'jingtailan', name: '景泰蓝', detail: '景泰年间掐丝珐琅达到艺术顶峰' },
      { icon: '🫖', id: 'yixing', name: '宜兴紫砂', detail: '"世间茶具之首"始于明代泡茶之风' },
      { icon: '🪚', id: 'dongyang', name: '东阳木雕', detail: '浙江三雕之首，明代建筑装饰的巅峰' },
      { icon: '🪁', id: 'weifang-kite', name: '潍坊风筝', detail: '明代风筝艺术走向成熟' }
    ]
  },
  '清代': {
    icon: '🪡', period: '公元1644—1912年',
    context: [
      '清代前期（康雍乾盛世）经济总量占全球约三分之一，手工业在庞大的国内外市场需求推动下持续繁荣。朝廷设立"造办处"集中管理宫廷工艺制作，汇集了全国最优秀的工匠。康熙、雍正、乾隆三位皇帝本人对工艺美术有浓厚兴趣，直接推动了工艺品质的提升。',
      '苏绣双面绣技艺在这一时期达到成熟——在同一块底料上绣出正反两面图案同样精美的作品，看不到线头和针迹，被誉为"东方明珠"。福州脱胎漆器以泥胎为模裱布刷漆后脱去泥胎，轻巧坚固、色泽典雅，与景泰蓝、景德镇瓷器并称中国传统工艺"三宝"。芜湖铁画以锤代笔、以铁为墨，开创了独特的金属艺术形式。',
      '清代的工艺特点是"集大成"——继承并完善了前代几乎所有工艺门类。然而清代中后期，随着西方工业革命产品的涌入和国力的衰退，传统手工艺开始面临前所未有的挑战。大量工艺从"日用"退向"观赏"，从"大众"退向"小众"，为现代的"非遗保护"埋下了伏笔。'
    ],
    crafts: [
      { icon: '🪡', id: 'suxiu', name: '苏绣', detail: '双面绣技艺成熟——正反两面同样精美' },
      { icon: '🏮', id: 'fuzhou-lacquer', name: '福州脱胎漆器', detail: '中国传统工艺"三宝"之一' },
      { icon: '🔨', id: 'wuhu', name: '芜湖铁画', detail: '以锤代笔，以铁为墨——中华一绝' }
    ]
  },
  '现代': {
    icon: '🏛️', period: '1949年至今',
    context: [
      '新中国成立后，传统手工艺经历了曲折的复兴之路。1957年周恩来总理指示"恢复青瓷生产"，龙泉瓷厂成立；2009年龙泉青瓷传统烧制技艺入选联合国人类非物质文化遗产代表作名录——这是陶瓷类项目的首次入选。此后中国剪纸、皮影戏、杭罗织造等多门工艺相继列入。',
      '在工业化浪潮的冲击下，传统手工艺面临着传承人老龄化、市场萎缩、原材料枯竭等严峻挑战。但互联网和AI技术也为传统工艺带来了新的可能——数字化记录永久保存技艺、AI辅助纹样设计、电商平台连接工匠与消费者、短视频让年轻一代重新"看见"传统。',
      '从新石器时代的良渚丝绸到今天的文脉智学，中国传统手工艺走过了超过五千年的历程。它们不仅是"过去的东西"，更是"未来的资源"——在可持续发展和文化多样性日益受到重视的今天，手工技艺所蕴含的匠人精神、自然智慧和审美价值，比以往任何时候都更加珍贵。'
    ],
    crafts: [
      { icon: '🏛️', id: 'longquan', name: '龙泉青瓷', detail: '2009年入选人类非遗代表作名录' },
      { icon: '✂️', id: 'paper-cut', name: '中国剪纸', detail: '2009年入选人类非遗代表作名录' },
      { icon: '🎭', id: 'shadow-puppet', name: '皮影戏', detail: '2011年入选人类非遗代表作名录' },
      { icon: '🧵', id: 'hangzhou-silk', name: '杭州丝绸', detail: '杭罗织造技艺入选人类非遗' }
    ]
  }
}

const eraName = computed(() => decodeURIComponent(route.params.name))
const era = computed(() => eraDatabase[eraName.value] || null)
const eraCrafts = computed(() => era.value?.crafts || [])
const eraDocs = computed(() => {
  if (!era.value) return []
  const craftIds = era.value.crafts.map(c => c.id)
  const allDocs = [
    { id: 'longquan', name: '龙泉青瓷', icon: '🏺', brief: '哥窑弟窑，粉青梅子青，人类非遗' },
    { id: 'hangzhou-silk', name: '杭州丝绸', icon: '🧵', brief: '良渚起源，杭罗缂丝，丝路瑰宝' },
    { id: 'jingdezhen', name: '景德镇瓷器', icon: '🫙', brief: '青花瓷、粉彩、玲珑瓷，千年瓷都' },
    { id: 'suxiu', name: '苏绣', icon: '🪡', brief: '双面绣绝技，中国四大名绣之首' },
    { id: 'jingtailan', name: '景泰蓝', icon: '🔔', brief: '铜胎掐丝珐琅，富丽堂皇' },
    { id: 'dongyang', name: '东阳木雕', icon: '🪚', brief: '平面浮雕，浙江三雕之首' },
    { id: 'yixing', name: '宜兴紫砂', icon: '🫖', brief: '紫砂壶，世间茶具之首' },
    { id: 'dehua', name: '德化白瓷', icon: '🏺', brief: '"中国白"，象牙白瓷塑闻名' },
    { id: 'shuxiu', name: '蜀绣', icon: '🪡', brief: '巴蜀瑰宝，中国四大名绣之一' },
    { id: 'weifang-kite', name: '潍坊风筝', icon: '🪁', brief: '扎糊绘放四艺，龙头蜈蚣' },
    { id: 'fuzhou-lacquer', name: '福州脱胎漆器', icon: '🏮', brief: '轻巧坚固，工艺三宝之一' },
    { id: 'nianhua', name: '木版年画', icon: '🖼️', brief: '杨柳青、桃花坞，四大年画产地' },
    { id: 'shadow-puppet', name: '皮影戏', icon: '🎭', brief: '最古老的"电影"艺术' },
    { id: 'wuhu', name: '芜湖铁画', icon: '🔨', brief: '以锤代笔，以铁为墨' },
    { id: 'paper-cut', name: '中国剪纸', icon: '✂️', brief: '阴刻阳刻，人类非遗' }
  ]
  const uniqueIds = new Set(craftIds)
  return allDocs.filter(d => uniqueIds.has(d.id))
})

const allCourses = [
  { id: 1, title: '龙泉青瓷入门：从泥到瓷', icon: '🏺', duration: '52:18', bvid: 'BV1kh411r7yU', desc: '青瓷讲堂系列：涵盖龙泉窑历史、粉青/梅子青釉色、哥窑弟窑鉴别。' },
  { id: 2, title: '杭绣技法：双面绣的秘密', icon: '🧵', duration: '5:42', bvid: 'BV1oj421R7QT', desc: '省级非遗传承人揭秘双面绣核心秘诀。' },
  { id: 3, title: '青瓷纹样中的吉祥寓意', icon: '🖌️', duration: '8:06', bvid: 'BV1rb4y1d7nN', desc: '解读龙泉青瓷常见纹样的文化含义。' },
  { id: 4, title: '景德镇青花瓷绘制技法', icon: '🏺', duration: '7:31', bvid: 'BV1VE411D7dz', desc: '匠心冶陶：青花及釉下彩绘全流程。' },
  { id: 5, title: '苏绣双面绣针法精讲', icon: '🧵', duration: '12:46', bvid: 'BV1cV411j7B7', desc: '苏绣针法教学系列合集。' },
  { id: 6, title: '东阳木雕浮雕入门', icon: '🪚', duration: '15:20', bvid: 'BV1Yh411B7sc', desc: '樟木独板浅浮雕技法完整演示。' },
  { id: 7, title: '景泰蓝掐丝工艺', icon: '🔔', duration: '8:45', bvid: 'BV16T4y1u7ur', desc: '掐丝珐琅画基础教程。' },
  { id: 8, title: '宜兴紫砂壶全手工制作', icon: '🫖', duration: '12:50', bvid: 'BV1xi8oe6EfN', desc: '老手艺人全手工制作全过程。' },
  { id: 9, title: '传统剪纸技法入门', icon: '✂️', duration: '32:15', bvid: 'BV1Ky4y1x7kA', desc: '剪纸基础教学全套。' }
]
const eraCourses = computed(() => {
  if (!era.value) return []
  const craftNames = era.value.crafts.map(c => c.name)
  return allCourses.filter(c => craftNames.some(n => c.title.includes(n) || c.desc.includes(n)))
})
</script>

<style scoped>
/* ====== 时代Hero卡片 ====== */
.era-hero {
  background: linear-gradient(160deg, #FDFAF4 0%, #F3EEDF 50%, #F7F2E8 100%);
  border-radius: var(--radius-lg);
  padding: 18px;
  margin-bottom: var(--space-xl);
  border: 1px solid rgba(139,119,90,0.12);
}
.era-hero-top {
  display: flex; flex-direction: column; gap: 4px;
  margin-bottom: 14px;
}
.era-hero-name {
  font-size: 20px; font-weight: 700; color: var(--ink-dark);
  font-family: 'Noto Serif SC', serif;
}
.era-hero-period {
  font-size: 12px; color: var(--silk-gold); font-weight: 500;
}

/* ====== 自动滚动文字区 ====== */
.era-scroll-box {
  height: 130px; overflow: hidden;
  position: relative; border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.5);
}
.era-scroll-box::before,
.era-scroll-box::after {
  content: ''; position: absolute; left: 0; right: 0; z-index: 1;
  height: 28px; pointer-events: none;
}
.era-scroll-box::before {
  top: 0;
  background: linear-gradient(to bottom, rgba(253,250,244,0.9), transparent);
}
.era-scroll-box::after {
  bottom: 0;
  background: linear-gradient(to top, rgba(247,242,232,0.9), transparent);
}

.era-scroll-track {
  animation: era-scroll var(--scroll-dur, 40s) linear infinite;
}
.era-scroll-item {
  height: 130px; display: flex; align-items: center;
  padding: 6px 14px; margin: 0;
  font-size: 13px; line-height: 1.9; color: var(--ink-mid);
}

@keyframes era-scroll {
  0%   { transform: translateY(0); }
  70%  { transform: translateY(var(--scroll-dist, -390px)); }
  100% { transform: translateY(0); }
}

/* ====== 工艺列表 ====== */
.era-section { margin-bottom: var(--space-xl); }
.era-section h3 {
  font-size: 15px; font-weight: 700; color: var(--ink-dark);
  font-family: 'Noto Serif SC', serif;
  margin-bottom: var(--space-md);
}
.craft-grid { display: flex; flex-direction: column; gap: var(--space-sm); }
.craft-item {
  display: flex; align-items: center; gap: var(--space-md);
  padding: 12px 14px; background: var(--card-bg);
  border-radius: var(--radius-md); border: 1px solid rgba(0,0,0,0.04);
  cursor: pointer; transition: background 0.15s;
}
.craft-item:active { background: var(--paper-warm); }
.craft-emoji { font-size: 28px; flex-shrink: 0; }
.craft-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.craft-name { font-size: 14px; font-weight: 600; color: var(--ink-dark); }
.craft-detail { font-size: 12px; color: var(--ink-light); }
.craft-arrow { font-size: 18px; color: var(--ink-light); flex-shrink: 0; }

/* ====== 课程 ====== */
.course-list { display: flex; flex-direction: column; gap: var(--space-sm); }
.course-item {
  display: flex; align-items: center; gap: var(--space-md);
  padding: 12px 14px; background: var(--card-bg);
  border-radius: var(--radius-md); border: 1px solid rgba(0,0,0,0.04);
  cursor: pointer; transition: background 0.15s;
}
.course-item:active { background: var(--paper-warm); }
.course-icon { font-size: 28px; flex-shrink: 0; }
.course-text { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.course-title { font-size: 14px; font-weight: 600; color: var(--ink-dark); }
.course-duration { font-size: 12px; color: var(--ink-light); }
.course-arrow { font-size: 14px; color: var(--celadon-dark); flex-shrink: 0; }

/* ====== 文档 ====== */
.doc-list { display: flex; flex-direction: column; gap: var(--space-sm); }
.doc-item {
  display: flex; align-items: center; gap: var(--space-md);
  padding: 12px 14px; background: var(--card-bg);
  border-radius: var(--radius-md); border: 1px solid rgba(0,0,0,0.04);
  cursor: pointer; transition: background 0.15s;
}
.doc-item:active { background: var(--paper-warm); }
.doc-icon { font-size: 28px; flex-shrink: 0; }
.doc-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.doc-name { font-size: 14px; font-weight: 600; color: var(--ink-dark); }
.doc-brief { font-size: 12px; color: var(--ink-light); }
.doc-arrow { font-size: 18px; color: var(--ink-light); flex-shrink: 0; }

/* ====== 视频播放器 ====== */
.video-overlay {
  position: absolute; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-lg);
}
.video-card {
  background: var(--card-bg); border-radius: var(--radius-lg);
  overflow: hidden; width: 100%; max-width: 480px;
}
.video-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
.video-header h3 { font-size: 15px; font-weight: 600; }
.video-header button {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: var(--paper-warm); font-size: 16px; cursor: pointer;
}
.video-frame { aspect-ratio: 16/9; background: #000; width: 100%; }
.video-desc { padding: 12px 16px; font-size: 13px; color: var(--ink-mid); line-height: 1.6; }
</style>
