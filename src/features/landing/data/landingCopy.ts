import type { LanguageCode } from '@/shared/types/usas';

export const LANDING_COPY: Record<LanguageCode, {
  eyebrow: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  cta: string;
  ctaSecondary: string;
  disclaimerTitle: string;
  disclaimerText: string;
  privacyLink: string;
  createdBy: string;
  previewTitle: string;
  featureOneTitle: string;
  featureOneDesc: string;
  featureTwoTitle: string;
  featureTwoDesc: string;
  featuresTitle: string;
  featuresDesc: string;
  featuresList: { title: string; desc: string }[];
  videoTitle: string;
  videoDesc: string;
  botsTitle: string;
  botsDesc: string;
  joinTitle: string;
  joinDesc: string;
  joinButton: string;
  suiteTitle: string;
  suiteDesc: string;
  card1Title: string;
  card1Desc: string;
  card2Title: string;
  card2Desc: string;
  card3Title: string;
  card3Desc: string;
  card4Title: string;
  card4Desc: string;
  card5Title: string;
  card5Desc: string;
  clashAlert: string;
  helpdeskTag: string;
  helpdeskTitle: string;
  helpdeskDesc: string;
  helpdeskTeam: string;
  helpdeskCta: string;
  helpdeskResponse: string;
  installTitle: string;
  installDesc: string;
  steps: { n: string; title: string; desc: string }[];
  bots: { name: string; tag: string; link: string; desc: string; color: string }[];
}> = {
  en: {
    eyebrow: 'USAS Class Timetable',
    titlePrefix: 'Student Class Timetable Portal for ',
    titleHighlight: 'USAS Students.',
    subtitle: 'A streamlined academic schedule portal to fetch, format, and export your USAS class timetable directly into device calendars, printable A4 PDFs, and lockscreen wallpapers.',
    cta: 'Log In Now',
    ctaSecondary: 'Watch Guide Video',
    disclaimerTitle: 'Data Security & Official Disclaimer',
    disclaimerText: 'Login requests pass through Cloudflare Pages to the official USAS UMC API. Your session and timetable cache are stored in this browser. Read our privacy notice for details.',
    privacyLink: 'Privacy notice',
    createdBy: 'An Independent Project by STEM USAS',
    previewTitle: 'Sample Timetable Preview',
    featureOneTitle: 'Official Academic Prints',
    featureOneDesc: 'Export your course schedule as an A4 landscape document for academic record-keeping or print-ready reference.',
    featureTwoTitle: 'Flexible Formatting',
    featureTwoDesc: 'Adapt your calendar representation instantly for your personal devices, complete with a clean night-mode view.',
    featuresTitle: 'Every Academic Feature in One Portal',
    featuresDesc: 'Engineered from the ground up to streamline your daily schedules, academic planning, and campus tracking.',
    featuresList: [
      { title: 'Smart Dashboard', desc: "View today's classes, classrooms, and dynamic attendance percentages instantly." },
      { title: 'Exam Schedules', desc: 'Retrieve your official examination dates, seat numbers, and venue halls.' },
      { title: 'GPA Calculator', desc: 'Calculate your current semester GPA and target CGPA with ease.' },
      { title: 'Prayer Times Notification', desc: 'Local prayer times integrated seamlessly alongside class hours.' }
    ],
    videoTitle: 'Watch Video Walkthrough',
    videoDesc: 'Discover how to sign in, resolve schedule overlaps, and configure high-resolution lockscreens in under 1 minute.',
    botsTitle: 'STEM Telegram Bots Ecology',
    botsDesc: 'Explore our previous official Telegram bots engineered to assist USAS students with homework alert deadlines and schedules.',
    joinTitle: 'Connect & Build. Join STEM USAS.',
    joinDesc: 'Join the STEM USAS club: an active student community blending technology with campus engagement and club events. Build digital tools and host exciting activities together with us!',
    joinButton: 'Membership Form',
    suiteTitle: 'Timetable Export Formats & Utilities',
    suiteDesc: 'Engineered specifically for instant offline accessibility, print integration, and calendar sync.',
    card1Title: 'Timetable Downloads (A4 PDF & Wallpapers)',
    card1Desc: 'Export your timetable as official landscape A4 PDFs or high-density lockscreen wallpapers matching your device screen sizes.',
    card2Title: 'Calendar Sync (.ICS)',
    card2Desc: 'Export all your lecture schedules directly into standard digital calendar clients (Google Calendar, Apple iCal, Outlook).',
    card3Title: 'WhatsApp & QR Sharing',
    card3Desc: 'Dispatch schedules to your peer groups instantly via WhatsApp or customized scan codes.',
    card4Title: 'Conflict Alerts & Attendance',
    card4Desc: 'System automatically flags overlapping sessions to prevent clashes while checking lecture presence records.',
    card5Title: 'Smart QR Attendance Scan',
    card5Desc: 'Skip the manual signing! Just upload or scan the lecturer\'s QR code directly from the app to mark your attendance instantly.',
    clashAlert: 'Class Clash Detected',
    helpdeskTag: 'LIVE HELPDESK ONLINE',
    helpdeskTitle: 'STEM Technical Support',
    helpdeskDesc: 'Experiencing lecture hall overlaps, layout issues, or calendar sync bugs? Connect directly with our team.',
    helpdeskTeam: 'Developers & STEM Squad',
    helpdeskCta: 'Chat via Telegram',
    helpdeskResponse: 'Avg. Response: < 10 Mins',
    installTitle: 'Install Portal App',
    installDesc: 'Add the official app icon to your home screen for lightning-fast access. No app store download required, lightweight & storage-friendly.',
    steps: [
      { n: '01', title: 'Official Sign In', desc: 'Authenticate securely using your official student credentials to link your academic identity.' },
      { n: '02', title: 'Personalized Dashboard', desc: 'View your subjects, schedules, and class venues in an elegant, personalized academic calendar display.' },
      { n: '03', title: 'Academic Prints & Wallpapers', desc: 'Generate official print-ready A4 PDFs or download custom high-resolution lockscreen wallpapers for your mobile device.' }
    ],
    bots: [
      {
        name: 'STEM USAS Bot',
        tag: '@stemusasbot',
        link: 'https://t.me/stemusasbot',
        desc: 'STEM USAS Telegram bot engineered to manage the membership verification process, status checks, and club directory system automations.',
        color: 'text-emerald-500 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.04]'
      },
      {
        name: 'USAS Due Bot',
        tag: '@usas_duebot',
        link: 'https://t.me/usas_duebot',
        desc: 'Automated assignment notifier bot that queries the USAS LMS portal and alerts students on upcoming coursework deadlines instantly.',
        color: 'text-blue-500 dark:text-blue-400 border-blue-500/20 bg-blue-500/[0.04]'
      }
    ]
  },
  ms: {
    eyebrow: 'Jadual Kuliah USAS',
    titlePrefix: 'Portal Jadual Waktu Kuliah ',
    titleHighlight: 'Pelajar USAS.',
    subtitle: 'Satu halaman akademik untuk mengambil, memformat, dan mengeksport jadual kuliah USAS anda secara langsung ke kalendar peranti, PDF cetakan A4, dan kertas dinding skrin kunci telefon.',
    cta: 'Log Masuk Sekarang',
    ctaSecondary: 'Tonton Panduan Video',
    disclaimerTitle: 'Keselamatan Data & Penafian Rasmi',
    disclaimerText: 'Permintaan log masuk melalui Cloudflare Pages ke API rasmi UMC USAS. Sesi dan cache jadual disimpan dalam pelayar ini. Baca notis privasi untuk maklumat lanjut.',
    privacyLink: 'Notis privasi',
    createdBy: 'Projek Pembelajaran Bebas oleh STEM USAS',
    previewTitle: 'Paparan Contoh Jadual',
    featureOneTitle: 'Eksport Akademik Rasmi',
    featureOneDesc: 'Cetak jadual kuliah dalam format landskap A4 untuk urusan universiti, atau simpan kertas dinding telefon pintar berskala penuh.',
    featureTwoTitle: 'Pemformatan Fleksibel',
    featureTwoDesc: 'Sesuaikan penampilan jadual anda mengikut keperluan visual tersendiri, lengkap dengan mod gelap mesra mata.',
    featuresTitle: 'Semua Ciri Akademik Di Satu Tempat',
    featuresDesc: 'Dibina khusus untuk memudahkan pengurusan jadual kuliah harian dan pencapaian akademik anda.',
    featuresList: [
      { title: 'Papan Pemuka Pintar', desc: 'Paparan subjek hari ini, dewan kuliah, dan peratus kehadiran semasa.' },
      { title: 'Jadual Peperiksaan', desc: 'Semak tarikh periksa, nombor tempat duduk, dan lokasi dewan peperiksaan secara langsung.' },
      { title: 'Kalkulator GPA', desc: 'Rancang keputusan akademik dengan pengiraan GPA/CGPA tersendiri.' },
      { title: 'Waktu Solat & Notifikasi', desc: 'Integrasi waktu solat tempatan mengikut zon jadual kuliah anda.' }
    ],
    videoTitle: 'Tonton Video Panduan',
    videoDesc: 'Pelajari cara log masuk, menyelaraskan waktu, dan mengeksport kertas dinding peranti anda dalam masa 1 minit.',
    botsTitle: 'Ekosistem Telegram Bot STEM',
    botsDesc: 'Terokai bot Telegram rasmi terdahulu yang dibina untuk memudahkan urusan tugasan harian dan notifikasi pelajar USAS.',
    joinTitle: 'Bina Komuniti Bersama STEM USAS',
    joinDesc: 'Sertai kelab STEM USAS! Komuniti aktif yang menggabungkan minat teknologi dengan aktiviti kelab dan kemasyarakatan pelajar. Jom bina projek digital dan anjur program menarik bersama kami!',
    joinButton: 'Borang Pendaftaran Ahli',
    suiteTitle: 'Format & Fungsi Eksport Jadual',
    suiteDesc: 'Portal ini dibina khusus untuk menyediakan akses luar talian yang pantas, mesra cetakan, dan boleh diselaraskan.',
    card1Title: 'Jadual Muat Turun (A4 PDF & Wallpaper)',
    card1Desc: 'Eksport jadual kuliah anda dalam format PDF rasmi landskap A4 untuk rujukan universiti, atau kertas dinding kunci telefon pintar berkualiti tinggi.',
    card2Title: 'Segerak Kalendar (.ICS)',
    card2Desc: 'Eksport subjek kuliah anda ke Google Calendar, Apple iCal, atau Microsoft Outlook dengan cepat.',
    card3Title: 'Kongsi QR & WhatsApp',
    card3Desc: 'Hantar pautan jadual kuliah anda kepada rakan kelas, atau biarkan mereka mengimbas kod QR peribadi.',
    card4Title: 'Utiliti Konflik & Kehadiran',
    card4Desc: 'Sistem mengesan pertindihan masa kuliah secara automatik untuk mengelakkan kekeliruan, di samping memantau peratusan kehadiran kuliah.',
    card5Title: 'Imbas Kehadiran QR Pintar',
    card5Desc: 'Lupakan tandatangan manual! Muat naik atau imbas kod QR pensyarah terus dari aplikasi untuk merekod kehadiran kuliah anda sekelip mata.',
    clashAlert: 'Terdapat Pertindihan',
    helpdeskTag: 'SOKONGAN LIVE AKTIF',
    helpdeskTitle: 'Sokongan Teknikal STEM',
    helpdeskDesc: 'Menghadapi pertindihan dewan kuliah, pepijat paparan, atau kesulitan import kalendar peranti? Kami sedia membantu secara percuma.',
    helpdeskTeam: 'Pembangun & Skuad STEM',
    helpdeskCta: 'Hubungi kami di Telegram',
    helpdeskResponse: 'Purata Balas: < 10 Minit',
    installTitle: 'Pasang Aplikasi Portal',
    installDesc: 'Tambah ikon aplikasi rasmi ke skrin utama peranti anda untuk capaian sepantas kilat. Tanpa muat turun dari kedai aplikasi, ringan & jimat data storan.',
    steps: [
      { n: '01', title: 'Pengesahan Rasmi', desc: 'Log masuk secara selamat menggunakan kredensial portal asal anda. Identiti akademik anda terpelihara.' },
      { n: '02', title: 'Papan Pemuka Peribadi', desc: 'Semak senarai subjek, masa kuliah, dan lokasi dewan kuliah hari ini dalam paparan kad yang tersusun.' },
      { n: '03', title: 'Dokumen & Kertas Dinding', desc: 'Jana dokumen PDF A4 rasmi untuk kegunaan akademik, atau muat turun fail kertas dinding mudah alih beresolusi ultra-tinggi.' }
    ],
    bots: [
      {
        name: 'STEM USAS Bot',
        tag: '@stemusasbot',
        link: 'https://t.me/stemusasbot',
        desc: 'Bot Telegram pengurusan ahli STEM USAS untuk semakan status keahlian, pengesahan kelayakan sistem ahli, dan rekod pangkalan data kelab secara automatik.',
        color: 'text-emerald-500 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.04]'
      },
      {
        name: 'USAS Due Bot',
        tag: '@usas_duebot',
        link: 'https://t.me/usas_duebot',
        desc: 'Bot notifikasi tugasan USAS yang menyemak portal LMS secara pintar untuk menghantar peringatan tarikh akhir tugasan kuliah terus ke Telegram.',
        color: 'text-blue-500 dark:text-blue-400 border-blue-500/20 bg-blue-500/[0.04]'
      }
    ]
  },
  zh: {
    eyebrow: 'USAS 课程时间表',
    titlePrefix: '苏丹阿兹兰沙大学 (USAS) ',
    titleHighlight: '学生专属课表门户。',
    subtitle: '便捷的学术课表管理门户，可直接获取、格式化并将您的 USAS 课程表导出至手机日历、A4 打印版 PDF 以及高清锁屏壁纸。',
    cta: '立即登录',
    ctaSecondary: '观看使用指南',
    disclaimerTitle: '数据安全与官方声明',
    disclaimerText: '登录请求会经由 Cloudflare Pages 转发至 USAS UMC 官方 API。登录会话和课表缓存保存在此浏览器中。详情请阅读隐私说明。',
    privacyLink: '隐私说明',
    createdBy: 'STEM USAS 独立技术项目',
    previewTitle: '示例课程表预览',
    featureOneTitle: '官方学术打印版',
    featureOneDesc: '导出 A4 横版 PDF 格式课表，适用于学术档案记录与高清打印参考。',
    featureTwoTitle: '灵活格式排版',
    featureTwoDesc: '随时根据个人设备自定义日程显示效果，支持护眼深色模式。',
    featuresTitle: '一站式学术日程管理',
    featuresDesc: '专为提升学生日常日程安排、学术规划与出勤管理效率而打造。',
    featuresList: [
      { title: '智能仪表盘', desc: '即时查看今日课程、教室地点与动态出勤率百分比。' },
      { title: '考试时间表', desc: '快速查询官方考试日期、座位号与考场地点。' },
      { title: 'GPA 计算器', desc: '轻松测算本学期 GPA 与目标 CGPA 成绩。' },
      { title: '祷告时间提醒', desc: '校园本地祷告时间与课程日程完美整合。' }
    ],
    videoTitle: '观看视频演示',
    videoDesc: '1 分钟内掌握登录操作、解决课程冲突与导出高清锁屏壁纸技巧。',
    botsTitle: 'STEM Telegram 机器人生态',
    botsDesc: '探索我们为 USAS 学生打造的官方 Telegram 智能通知机器人。',
    joinTitle: '携手共建 欢迎加入 STEM USAS',
    joinDesc: '加入 STEM USAS 俱乐部！活跃的科技与学术社区，与志同道合的伙伴一起开发实用数字工具、举办精彩校园活动！',
    joinButton: '会员报名表格',
    suiteTitle: '课表导出格式与实用功能',
    suiteDesc: '专为离线访问、打印对接与跨平台日历同步而精心设计。',
    card1Title: '课表下载 (A4 PDF 与壁纸)',
    card1Desc: '导出正式 A4 横版 PDF 课表，或生成适配各型号手机屏幕的高清锁屏壁纸。',
    card2Title: '日历同步 (.ICS)',
    card2Desc: '将课程一键同步至 Google 日历、Apple iCal 或 Outlook。',
    card3Title: 'WhatsApp 与二维码分享',
    card3Desc: '通过 WhatsApp 或专属课表二维码快速与同班同学分享课程安排。',
    card4Title: '冲突预警与出勤监控',
    card4Desc: '自动识别重叠课程避免冲突，同时精准监控各科考勤达标情况。',
    card5Title: '智能二维码考勤打卡',
    card5Desc: '告别手动签到！直接上传或扫描讲师的二维码，即可瞬间完成考勤记录。',
    clashAlert: '检测到课程冲突',
    helpdeskTag: '在线技术支持',
    helpdeskTitle: 'STEM 官方技术支持',
    helpdeskDesc: '遇到教室冲突、排版异常或日历同步疑问？随时联系我们获得协助。',
    helpdeskTeam: '开发团队与 STEM 成员',
    helpdeskCta: '在 Telegram 上联系',
    helpdeskResponse: '平均响应时间: < 10 分钟',
    installTitle: '安装应用程序',
    installDesc: '将官方应用程序图标添加到您的主屏幕以实现闪电般快速访问。无需从应用商店下载，体积小巧节省存储空间。',
    steps: [
      { n: '01', title: '官方安全登录', desc: '使用官方学生凭证安全登录，直接同步您的真实学术日程。' },
      { n: '02', title: '个性化仪表盘', desc: '在清晰美观的卡片视图中查看今日科目、时间与教室地点。' },
      { n: '03', title: '学术导出与壁纸', desc: '一键生成正式 A4 PDF 打印件，或下载专属手机锁屏壁纸。' }
    ],
    bots: [
      {
        name: 'STEM USAS Bot',
        tag: '@stemusasbot',
        link: 'https://t.me/stemusasbot',
        desc: 'STEM USAS 会员服务 Telegram 机器人，用于会员资格验证与社团系统自动化。',
        color: 'text-emerald-500 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.04]'
      },
      {
        name: 'USAS Due Bot',
        tag: '@usas_duebot',
        link: 'https://t.me/usas_duebot',
        desc: 'USAS 作业截止日期提醒机器人，智能同步课程门户并推送截止提醒。',
        color: 'text-blue-500 dark:text-blue-400 border-blue-500/20 bg-blue-500/[0.04]'
      }
    ]
  },
  ta: {
    eyebrow: 'USAS வகுப்பு அட்டவணை',
    titlePrefix: 'சுல்தான் அஸ்லான் ஷா பல்கலைக்கழக ',
    titleHighlight: 'மாணவர் வகுப்பு அட்டவணை தளம்.',
    subtitle: 'உங்கள் USAS வகுப்பு அட்டவணையை நேரடியாக சாதன காலண்டர்கள், A4 PDF ஆவணங்கள் மற்றும் பூட்டுத்திரை வால்பேப்பர்களாக மாற்றும் நவீன கல்வித் தளம்.',
    cta: 'இப்போது உள்நுழைக',
    ctaSecondary: 'வழிகாட்டி வீடியோவைப் பாருங்கள்',
    disclaimerTitle: 'தரவு பாதுகாப்பு மற்றும் அதிகாரப்பூர்வ மறுப்பு',
    disclaimerText: 'உள்நுழைவு கோரிக்கைகள் Cloudflare Pages வழியாக அதிகாரப்பூர்வ USAS UMC API-க்கு அனுப்பப்படும். அமர்வும் அட்டவணை தற்காலிகச் சேமிப்பும் இந்த உலாவியில் சேமிக்கப்படும். விவரங்களுக்கு தனியுரிமை அறிவிப்பைப் படிக்கவும்.',
    privacyLink: 'தனியுரிமை அறிவிப்பு',
    createdBy: 'STEM USAS இன் சுயாதீன திட்டம்',
    previewTitle: 'மாதிரி அட்டவணை முன்னோட்டம்',
    featureOneTitle: 'அதிகாரப்பூர்வ கல்வி அச்சிடல்கள்',
    featureOneDesc: 'பல்கலைக்கழக பதிவுகளுக்காக அல்லது அச்சிடுவதற்காக உங்கள் அட்டவணையை A4 PDF வடிவில் ஏற்றுமதி செய்யுங்கள்.',
    featureTwoTitle: 'நெகிழ்வான வடிவமைப்பு',
    featureTwoDesc: 'இரவு நேர பார்வைக்கு ஏற்றவாறு உங்கள் அட்டவணை தோற்றத்தை மாற்றியமைத்துக் கொள்ளுங்கள்.',
    featuresTitle: 'அனைத்து கல்வி அம்சங்களும் ஒரே தளத்தில்',
    featuresDesc: 'உங்கள் அன்றாட வகுப்பு திட்டமிடலை எளிதாக்க பிரத்யேகமாக உருவாக்கப்பட்டது.',
    featuresList: [
      { title: 'ஸ்மார்ட் டாஷ்போர்டு', desc: 'இன்றைய வகுப்புகள், வகுப்பறைகள் மற்றும் வருகை சதவீதத்தை உடனடியாகப் பாருங்கள்.' },
      { title: 'தேர்வு அட்டவணை', desc: 'அதிகாரப்பூர்வ தேர்வு தேதிகள், இருக்கை எண்கள் மற்றும் மண்டப விவரங்களை அறியுங்கள்.' },
      { title: 'GPA கணிப்பான்', desc: 'உங்கள் செமஸ்டர் GPA மற்றும் இலக்கு CGPA முடிவுகளை எளிதாக கணக்கிடுங்கள்.' },
      { title: 'பிரார்த்தனை நேரங்கள்', desc: 'வகுப்பு நேரங்களுடன் ஒருங்கிணைந்த உள்ளூர் தொழுகை நேரங்கள்.' }
    ],
    videoTitle: 'வீடியோ வழிகாட்டியைப் பாருங்கள்',
    videoDesc: '1 நிமிடத்தில் உள்நுழைவது, அட்டவணையைச் சரிசெய்வது மற்றும் வால்பேப்பர்களைப் பதிவிறக்குவது எப்படி என்பதை அறிந்து கொள்ளுங்கள்.',
    botsTitle: 'STEM டெலிகிராம் போட்கள்',
    botsDesc: 'USAS மாணவர்களுக்கு உதவ உருவாக்கப்பட்ட எங்கள் அதிகாரப்பூர்வ டெலிகிராம் போட்களை ஆராயுங்கள்.',
    joinTitle: 'STEM USAS உடன் இணையுங்கள்',
    joinDesc: 'STEM USAS சங்கத்தில் சேருங்கள்! தொழில்நுட்ப ஆர்வலர்கள் மற்றும் மாணவர் சமூகத்துடன் இணைந்து புதிய டிஜிட்டல் திட்டங்களை உருவாக்குங்கள்!',
    joinButton: 'உறுப்பினர் படிவம்',
    suiteTitle: 'அட்டவணை ஏற்றுமதி வடிவங்கள்',
    suiteDesc: 'ஆஃப்லைன் அணுகல், அச்சு இணக்கம் மற்றும் காலண்டர் ஒத்திசைவுக்காக வடிவமைக்கப்பட்டது.',
    card1Title: 'அட்டவணை பதிவிறக்கங்கள் (A4 PDF & வால்பேப்பர்கள்)',
    card1Desc: 'உங்கள் அட்டவணையை அதிகாரப்பூர்வ A4 PDF அல்லது உயர் தெளிவுத்திறன் கொண்ட மொபைல் வால்பேப்பர்களாக ஏற்றுமதி செய்யுங்கள்.',
    card2Title: 'காலண்டர் ஒத்திசைவு (.ICS)',
    card2Desc: 'உங்கள் வகுப்பு அட்டவணையை Google Calendar, Apple iCal அல்லது Outlook இல் நேரடியாகச் சேர்க்கவும்.',
    card3Title: 'WhatsApp & QR பகிர்வு',
    card3Desc: 'WhatsApp அல்லது பிரத்யேக QR குறியீடு மூலம் நண்பர்களுடன் அட்டவணையைப் பகிருங்கள்.',
    card4Title: 'நேர முரண்பாடு & வருகை எச்சரிக்கை',
    card4Desc: 'கணினி தானாகவே ஒன்றுடன் ஒன்று அமர்வுகளை கொடியிடுகிறது.',
    card5Title: 'ஸ்மார்ட் QR வருகை ஸ்கேன்',
    card5Desc: 'கைமுறை கையொப்பத்தைத் தவிர்க்கவும்! உங்கள் வருகையை உடனடியாக பதிவு செய்ய விரிவுரையாளரின் QR குறியீட்டை பயன்பாட்டிலிருந்து நேரடியாக பதிவேற்றவும் அல்லது ஸ்கேன் செய்யவும்.',
    clashAlert: 'வகுப்பு முரண்பாடு உள்ளது',
    helpdeskTag: 'நேரலை உதவி மையம்',
    helpdeskTitle: 'STEM தொழில்நுட்ப ஆதரவு',
    helpdeskDesc: 'வகுப்பறை முரண்பாடுகள் அல்லது காலண்டர் பிழைகளை எதிர்கொள்கிறீர்களா? எங்களைத் தொடர்பு கொள்ளுங்கள்.',
    helpdeskTeam: 'உருவாக்குநர்கள் & STEM குழு',
    helpdeskCta: 'Telegram மூலம் தொடர்பு கொள்ளவும்',
    helpdeskResponse: 'சராசரி பதிலளிப்பு: < 10 நிமிடங்கள்',
    installTitle: 'செயலியை நிறுவுக',
    installDesc: 'விரைவான அணுகலுக்கு உங்கள் முகப்புத் திரையில் அதிகாரப்பூர்வ பயன்பாட்டு ஐகானைச் சேர்க்கவும். ஆப் ஸ்டோர் பதிவிறக்கம் தேவையில்லை, சிறிய அளவு மற்றும் சேமிப்பிடத்தை சேமிக்கும்.',
    steps: [
      { n: '01', title: 'அதிகாரப்பூர்வ உள்நுழைவு', desc: 'உங்கள் மாணவர் தகவல்களைப் பயன்படுத்தி பாதுகாப்பாக உள்நுழையவும்.' },
      { n: '02', title: 'தனிப்பயன் டாஷ்போர்டு', desc: 'இன்றைய பாடங்கள், நேரங்கள் மற்றும் இடங்களை நேர்த்தியான அட்டை வடிவில் பாருங்கள்.' },
      { n: '03', title: 'கல்வி அச்சு & வால்பேப்பர்கள்', desc: 'அதிகாரப்பூர்வ A4 PDF அல்லது மொபைல் பூட்டுத்திரை வால்பேப்பர்களைப் பெறுங்கள்.' }
    ],
    bots: [
      {
        name: 'STEM USAS Bot',
        tag: '@stemusasbot',
        link: 'https://t.me/stemusasbot',
        desc: 'STEM USAS உறுப்பினர் சரிபார்ப்பு மற்றும் தகவல் மேலாண்மைக்கான டெலிகிராம் போட்.',
        color: 'text-emerald-500 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.04]'
      },
      {
        name: 'USAS Due Bot',
        tag: '@usas_duebot',
        link: 'https://t.me/usas_duebot',
        desc: 'USAS வீட்டுப்பாட காலக்கெடுவை நினைவூட்டும் தானியங்கி டெலிகிராம் போட்.',
        color: 'text-blue-500 dark:text-blue-400 border-blue-500/20 bg-blue-500/[0.04]'
      }
    ]
  }
};

export type LandingCopy = typeof LANDING_COPY.en;
