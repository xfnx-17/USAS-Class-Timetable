import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme, THEMES } from '@/app/providers/ThemeProvider';
import type { LanguageCode } from '@/shared/types/usas';
import {
  Download, Moon, Share2, AlertTriangle, ArrowRight,
  ExternalLink, Send, Play, Instagram, Github, ShieldAlert, ScanLine, ArrowUp
} from 'lucide-react';

type LandingPageProps = {
  onNavigateLogin?: () => void;
  onGoToLogin?: () => void;
};

const LANDING_COPY: Record<LanguageCode, {
  eyebrow: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  cta: string;
  ctaSecondary: string;
  disclaimerTitle: string;
  disclaimerText: string;
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
    disclaimerText: 'This portal connects directly to the official USAS UMC API. We (the developers & STEM USAS) do not operate middle servers, do not store, and do not touch any personal student data or login credentials.',
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
    disclaimerText: 'Portal ini menghubungi API rasmi UMC USAS secara terus. Kami (pembangun & STEM USAS) tidak mempunyai pelayan tengah, tidak menyimpan, tidak memodifikasi, dan tidak menyentuh sebarang data peribadi mahupun kredensial log masuk pelajar.',
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
    disclaimerText: '本门户直接与官方 USAS UMC API 通信。我们（开发团队与 STEM USAS）不设立中间服务器，绝不存储、修改或接触任何学生个人数据与登录凭据。',
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
    disclaimerText: 'இந்த தளம் அதிகாரப்பூர்வ USAS UMC API உடன் நேரடியாக இணைகிறது. நாங்கள் (உருவாக்குநர்கள் & STEM USAS) மாணவர் தனிப்பட்ட தரவு அல்லது உள்நுழைவு தகவல்களை சேமிக்கவோ தொடவோ மாட்டோம்.',
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

export default function LandingPage({ onNavigateLogin, onGoToLogin }: LandingPageProps) {
  const handleLogin = onNavigateLogin || onGoToLogin || (() => {});
  const { lang, t } = useLanguage();
  const { theme } = useTheme();
  const [scrollY, setScrollY] = useState(0);

  // 3D Card Hover Perspective State
  const [mouseRotate, setMouseRotate] = useState({ x: 0, y: 0 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMouseRotate({
      x: -(y / (rect.height / 2)) * 8,
      y: (x / (rect.width / 2)) * 8
    });
    setIsHoveringCard(true);
  };

  const handleMouseLeave = () => {
    setMouseRotate({ x: 0, y: 0 });
    setIsHoveringCard(false);
  };

  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop;
          setScrollY(currentScrollY);
          
          const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          if (windowHeight > 0) {
            setScrollPercent(currentScrollY / windowHeight);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initialize on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLight = theme === THEMES.LIGHT;

  const copy = LANDING_COPY[lang] || LANDING_COPY.en;
  const steps = copy.steps;

  return (
    <div className={`relative isolate overflow-hidden min-h-[120svh] ${
      theme === THEMES.LIGHT ? 'bg-[#f8fafc] text-slate-800' :
      theme === THEMES.OLED ? 'bg-black text-slate-100' :
      theme === THEMES.EMERALD ? 'bg-[#012117] text-slate-100' :
      'bg-[#060E1F] text-slate-100'
    }`}>
      
      {/* Interactive Scroll Progress Line */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
        <div 
          className={`h-full ${isLight ? 'bg-amber-500' : 'bg-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'}`}
          style={{ width: `${scrollPercent * 100}%` }} 
        />
      </div>

      {/* Dynamic Background Blurs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Colorful Glowing Ambient Blobs */}
        <div className={`absolute -top-40 left-1/2 -translate-x-1/2 h-[380px] w-[min(600px,90vw)] rounded-full blur-[120px] opacity-40 ${isLight ? 'bg-gradient-to-tr from-amber-200 to-sky-200' : 'bg-gradient-to-tr from-amber-500/10 to-indigo-500/10'
          }`} />
        <div className={`absolute top-20 right-10 h-80 w-80 rounded-full blur-[100px] opacity-35 ${isLight ? 'bg-amber-200' : 'bg-amber-500/5'
          }`} />
        <div className={`absolute top-60 left-10 h-96 w-96 rounded-full blur-[100px] opacity-35 ${isLight ? 'bg-sky-200' : 'bg-sky-500/5'
          }`} />
      </div>

      {/* SECTION 1: Above-the-fold Viewport (Hero Area) */}
      <section className="relative w-full min-h-[calc(100svh-3.5rem)] lg:min-h-[calc(100vh-3.5rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pb-12 lg:pb-28 border-b border-slate-200/10 dark:border-white/5 overflow-hidden">
        
        <div className="max-w-3xl w-full text-center space-y-6 z-10 relative">
          
          {/* Eyebrow Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wide transition-all shadow-sm mx-auto animate-fade-in ${isLight ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-amber-500/20 bg-amber-500/10 text-amber-400'}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{copy.eyebrow}</span>
          </div>

          {/* Main Hero Header */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-balance">
            {copy.titlePrefix}
            <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
              {copy.titleHighlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base leading-relaxed opacity-75 max-w-2xl mx-auto text-balance font-medium">
            {copy.subtitle}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              onClick={handleLogin}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full text-[11px] sm:text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20 uppercase tracking-wider"
            >
              <span>{copy.cta}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <a
              href="#guide-video"
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-full text-[11px] sm:text-xs font-bold border transition-colors ${
                isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-slate-300'
              }`}
            >
              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current opacity-70" />
              <span>{copy.ctaSecondary}</span>
            </a>
          </div>

        </div>

        {/* Desktop Scroll-Down Prompt */}
        <div className="hidden lg:flex absolute bottom-5 left-1/2 -translate-x-1/2 flex-col items-center gap-2.5 z-20">
          <span className="text-[9px] font-black tracking-[0.2em] uppercase opacity-60 text-slate-500 dark:text-slate-400 select-none">
            {lang === 'ms' ? 'Skrol ke Bawah' : lang === 'zh' ? '向下滚动' : lang === 'ta' ? 'கீழே உருட்டவும்' : 'Scroll Down'}
          </span>
          {/* Sleek Mouse Wheel Icon */}
          <div className="w-5.5 h-9 rounded-full border-2 border-slate-300 dark:border-white/25 flex justify-center p-1.5 opacity-70">
            <div className="w-1 h-2 bg-amber-500 rounded-full animate-scroll-wheel" />
          </div>
        </div>

      </section>

      {/* SECTION 2: Scrollable Content Wrapper */}
      <section className="relative mx-auto max-w-4xl px-4 sm:px-6 py-20 space-y-24">

        {/* 3D Mockup & Features Playground Grid */}
        <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto items-stretch">

          {/* Left Column: Interactive 3D Mockup */}
          <div
            className="relative w-full cursor-pointer h-full"
            style={{ perspective: '1200px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`rounded-2xl border p-4 sm:p-5 shadow-2xl origin-top-center h-full flex flex-col justify-between ${
                isHoveringCard ? 'transition-none' : 'transition-transform duration-300 ease-out'
              } ${isLight
                ? 'border-slate-200 bg-white/95'
                : 'border-white/[0.08] bg-[#0A1428]/95'
                }`}
              style={isMobile ? undefined : {
                transform: `rotateX(${mouseRotate.x}deg) rotateY(${mouseRotate.y}deg) scale(1) translateY(0px)`,
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitFontSmoothing: 'antialiased',
                opacity: 1
              }}
            >
              {/* Mockup Header */}
              <div
                className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pb-3 mb-4 border-b border-slate-200/50 dark:border-white/10 text-[9px] sm:text-[10px] font-bold opacity-60"
                style={{ transform: 'translateZ(30px)' }}
              >
                <span>MATRIK: AI210042</span>
                <span className={`px-2 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/[0.06] text-amber-300'}`}>
                  {copy.previewTitle}
                </span>
                <span>PROGRAM: CS</span>
              </div>

              {/* Mockup Grid Rows */}
              <div className="space-y-3 flex-1 flex flex-col justify-between" style={{ transform: 'translateZ(10px)' }}>
                {[
                  {
                    day: t('days.ISNIN'),
                    time: '8:30 AM - 10:30 AM',
                    code: 'CSC2103',
                    course: lang === 'ms' ? 'Struktur Data & Algoritma' : lang === 'zh' ? '数据结构与算法' : lang === 'ta' ? 'தரவு கட்டமைப்புகள்' : 'Data Structures & Algorithms',
                    loc: lang === 'ms' ? 'Makmal 3' : lang === 'zh' ? '3号计算机房' : lang === 'ta' ? 'ஆய்வகம் 3' : 'Lab 3',
                    theme: {
                      accent: isLight ? 'border-l-emerald-500' : 'border-l-emerald-400',
                      border: isLight ? 'border-emerald-500/20' : 'border-emerald-500/30',
                      bg: isLight ? 'bg-emerald-500/[0.08]' : 'bg-emerald-500/[0.15]',
                      text: isLight ? 'text-emerald-700' : 'text-emerald-350',
                      badge: isLight
                        ? 'bg-emerald-600 text-white border-emerald-600/30'
                        : 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                    }
                  },
                  {
                    day: t('days.SELASA'),
                    time: '9:00 AM - 12:00 PM',
                    code: 'BIT2043',
                    course: lang === 'ms' ? 'Pembangunan Aplikasi Web' : lang === 'zh' ? 'Web 应用程序开发' : lang === 'ta' ? 'வலை பயன்பாட்டு உருவாக்கம்' : 'Web Application Development',
                    loc: lang === 'ms' ? 'Makmal Perisian' : lang === 'zh' ? '软件实验室' : lang === 'ta' ? 'மென்பொருள் ஆய்வகம்' : 'Software Lab',
                    theme: {
                      accent: isLight ? 'border-l-blue-500' : 'border-l-blue-400',
                      border: isLight ? 'border-blue-500/20' : 'border-blue-500/30',
                      bg: isLight ? 'bg-blue-500/[0.08]' : 'bg-blue-500/[0.15]',
                      text: isLight ? 'text-blue-700' : 'text-blue-350',
                      badge: isLight
                        ? 'bg-blue-600 text-white border-blue-600/30'
                        : 'bg-blue-500/30 text-blue-300 border-blue-500/50'
                    }
                  },
                  {
                    day: t('days.RABU'),
                    time: '2:00 PM - 5:00 PM',
                    code: 'SEC3303',
                    course: lang === 'ms' ? 'Keselamatan Rangkaian' : lang === 'zh' ? '网络安全与防御' : lang === 'ta' ? 'பிணைய பாதுகாப்பு' : 'Network Security & Defense',
                    loc: lang === 'ms' ? 'Dewan Kuliah 2' : lang === 'zh' ? '第 2 讲堂' : lang === 'ta' ? 'விரிவுரை அரங்கம் 2' : 'Lecture Hall 2',
                    theme: {
                      accent: isLight ? 'border-l-amber-500' : 'border-l-amber-400',
                      border: isLight ? 'border-amber-500/20' : 'border-amber-500/30',
                      bg: isLight ? 'bg-amber-500/[0.08]' : 'bg-amber-500/[0.15]',
                      text: isLight ? 'text-amber-700' : 'text-amber-350',
                      badge: isLight
                        ? 'bg-amber-600 text-white border-amber-600/30'
                        : 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                    }
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-300 ${item.theme.bg} ${item.theme.border} border-l-[3px] ${item.theme.accent}`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[9px]">
                      <span className={`font-bold uppercase tracking-wider ${item.theme.text}`}>
                        {item.day}
                      </span>
                      <span className="opacity-60 text-[9px] font-mono">{item.time}</span>
                    </div>
                    <div className="my-1">
                      <div className="text-[10px] font-extrabold line-clamp-1">{item.course}</div>
                    </div>
                    <div className="flex items-center justify-between text-[8px] opacity-75">
                      <span className={`px-1 py-0.5 rounded font-black font-mono border ${item.theme.badge}`}>
                        {item.code}
                      </span>
                      <span className="font-semibold">{item.loc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mockup Footer Indicator */}
              <div
                className="mt-4 pt-2 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-[8px] font-semibold opacity-40 uppercase tracking-widest"
                style={{ transform: 'translateZ(20px)' }}
              >
                <span />
                <span>STEM USAS</span>
              </div>
            </div>
          </div>

          {/* Right Column: Workflow Steps */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                {lang === 'ms' ? 'ALIRAN PENGGUNA' : lang === 'zh' ? '使用流程' : lang === 'ta' ? 'பயன்பாட்டு முறை' : 'USER WORKFLOW'}
              </span>
              <h3 className="text-xl font-black tracking-tight">{copy.featuresTitle}</h3>
              <p className="text-xs opacity-75 leading-relaxed">{copy.featuresDesc}</p>
            </div>

            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all duration-300 ${isLight
                    ? 'bg-white border-slate-200/80 shadow-sm'
                    : 'bg-white/[0.015] border-white/[0.04]'
                    }`}
                >
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-black font-mono shrink-0">
                    {step.n}
                  </div>
                  <div className="space-y-0.5 text-left">
                    <h4 className="text-xs font-extrabold">{step.title}</h4>
                    <p className="text-[11px] opacity-70 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Feature Bento Grid */}
        <div className="mt-24 space-y-6">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-lg font-black tracking-tight text-amber-500">{copy.suiteTitle}</h3>
            <p className="text-xs opacity-75">{copy.suiteDesc}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">

            {/* Card 1: Downloadable Formats */}
            <div className={`md:col-span-2 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[160px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2 max-w-full sm:max-w-[52%]">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <Download className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">{copy.card1Title}</h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {copy.card1Desc}
                </p>
              </div>

              {/* Graphical Stack Representation Inside Bento Card */}
              <div className="absolute right-3 bottom-0 top-6 w-32 hidden sm:block pointer-events-none" style={{ perspective: '800px' }}>
                <div className="absolute right-0 bottom-[-10px] w-14 h-24 rounded-lg bg-amber-500/10 border border-amber-500/20 rotate-[-12deg] shadow-lg flex flex-col p-1 gap-1 text-[4px] leading-none select-none">
                  <div className="h-2 w-full bg-amber-500/20 rounded-sm" />
                  <div className="h-1 bg-white/20 rounded-sm" />
                  <div className="h-1 bg-white/20 rounded-sm" />
                </div>
                <div className="absolute right-6 bottom-[-5px] w-20 h-16 rounded-md bg-slate-500/10 border border-slate-500/25 rotate-[8deg] shadow-lg flex flex-col p-1 gap-1 text-[3px] leading-none select-none">
                  <div className="h-1.5 w-full bg-slate-500/20 rounded-sm" />
                  <div className="grid grid-cols-3 gap-0.5">
                    <div className="h-6 bg-white/10 rounded-sm" />
                    <div className="h-6 bg-white/10 rounded-sm" />
                    <div className="h-6 bg-white/10 rounded-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Calendar Sync */}
            <div className={`md:col-span-1 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg flex flex-col justify-between min-h-[160px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <Moon className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">{copy.card2Title}</h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {copy.card2Desc}
                </p>
              </div>
            </div>

            {/* Card 3: WhatsApp & QR Sharing */}
            <div className={`md:col-span-1 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg flex flex-col justify-between min-h-[160px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <Share2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">{copy.card3Title}</h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {copy.card3Desc}
                </p>
              </div>
            </div>

            {/* Card 4: Clash Detection & Attendance */}
            <div className={`md:col-span-2 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[160px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2 max-w-full sm:max-w-[52%]">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">{copy.card4Title}</h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {copy.card4Desc}
                </p>
              </div>

              {/* Decorative Mini Widgets */}
              <div className="absolute right-5 bottom-4 hidden sm:flex items-center gap-3 pointer-events-none">
                <div className="px-2 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-[8px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{copy.clashAlert}</span>
                </div>
                <div className="relative h-10 w-10 flex items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[9px] font-black text-emerald-500">
                  95%
                </div>
              </div>
            </div>

            {/* Card 5: Smart QR Attendance Scan */}
            <div className={`md:col-span-3 rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[140px] ${isLight ? 'bg-white border-slate-200/60 shadow-sm' : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
              }`}>
              <div className="space-y-2 max-w-full sm:max-w-[70%]">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/[0.06] text-amber-300'
                    }`}>
                    <ScanLine className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-xs text-left">{copy.card5Title}</h4>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed text-left">
                  {copy.card5Desc}
                </p>
              </div>

              {/* Decorative Mini Widgets */}
              <div className="absolute right-6 bottom-4 top-4 hidden sm:flex flex-col items-center justify-center gap-2 pointer-events-none opacity-80">
                <div className="h-14 w-14 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 flex items-center justify-center relative">
                  <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-amber-500"></div>
                  <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-amber-500"></div>
                  <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-amber-500"></div>
                  <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-amber-500"></div>
                  <div className="h-[2px] w-full bg-amber-500/50 absolute top-1/2 -translate-y-1/2 rounded-full"></div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Install App (PWA) Suggestion Section */}
        <div className={`mt-24 rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 justify-between text-center sm:text-left transition-all hover:shadow-lg ${
          isLight 
            ? 'bg-gradient-to-br from-amber-50 to-white border-amber-200/60 shadow-sm' 
            : 'bg-gradient-to-br from-amber-900/10 to-transparent border-amber-500/20 shadow-xl'
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner ${
              isLight ? 'bg-white border border-amber-100 shadow-amber-500/10' : 'bg-[#0A1428] border border-amber-500/30 shadow-black'
            }`}>
              <Download className={`w-8 h-8 sm:w-10 sm:h-10 ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className={`text-lg font-black tracking-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {copy.installTitle}
              </h3>
              <p className={`text-[11px] sm:text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                {copy.installDesc}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 ${
              isLight 
                ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-amber-500/20' 
                : 'bg-amber-400 text-slate-900 hover:bg-amber-300 hover:shadow-amber-400/20'
            }`}>
              {copy.installTitle}
            </button>
          </div>
        </div>

        {/* Video Tutorial Walkthrough Section */}
        <div id="guide-video" className="mt-24 max-w-2xl mx-auto space-y-6 scroll-mt-24">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-lg font-black tracking-tight text-amber-500">{copy.videoTitle}</h3>
            <p className="text-xs opacity-75">{copy.videoDesc}</p>
          </div>

          <div
            className={`group rounded-2xl border p-4 transition-all duration-300 relative overflow-hidden aspect-[4/3] sm:aspect-video min-h-[220px] sm:min-h-0 flex items-center justify-center cursor-pointer shadow-md ${isLight
              ? 'bg-slate-100/50 border-slate-200'
              : 'bg-white/[0.015] border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.025]'
              }`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity z-0" />

            <div className="h-16 w-16 rounded-full bg-[#0A1428]/80 backdrop-blur border border-white/20 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:text-amber-300 transition-all duration-300 shadow-xl z-10">
              <Play className="w-6 h-6 fill-amber-400 group-hover:fill-amber-300 translate-x-[1px]" />
            </div>

            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[8px] tracking-widest font-mono text-white/50 z-10 select-none">
              <span>0:00 / 0:59</span>
              <div className="flex-1 mx-3 h-[2px] rounded-full bg-white/20 overflow-hidden">
                <div className="w-[18%] h-full bg-amber-500 rounded-full" />
              </div>
              <span>1080P HD</span>
            </div>
          </div>
        </div>

        {/* Previous STEM Projects */}
        <div className="mt-24 max-w-2xl mx-auto space-y-6">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-lg font-black tracking-tight text-amber-500">{copy.botsTitle}</h3>
            <p className="text-xs opacity-75">{copy.botsDesc}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {copy.bots.map((bot, idx) => (
              <a
                key={idx}
                href={bot.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[140px] hover:shadow-lg ${isLight
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]'
                  }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${bot.color}`}>
                        TELEGRAM
                      </span>
                      <span className="text-[10px] opacity-40 font-bold font-mono">{bot.tag}</span>
                    </div>
                    <Send className="w-3.5 h-3.5 opacity-45 hover:opacity-100 hover:text-amber-500 transition-all" />
                  </div>
                  <h4 className="font-extrabold text-sm text-left">{bot.name}</h4>
                  <p className="text-[11px] opacity-70 leading-relaxed text-left">{bot.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Join STEM USAS Membership Card */}
        <div className="mt-24 max-w-2xl mx-auto">
          <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden transition-all duration-300 hover:shadow-xl ${isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-gradient-to-br from-amber-500/[0.03] to-transparent border-white/[0.05] hover:border-white/[0.08]'
            }`}>
            <div className="space-y-3 text-center sm:text-left max-w-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <img 
                  src="/stem-logo.png" 
                  alt="Persatuan Sains Teknologi & Multimedia" 
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md"
                />
                <div className="space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black tracking-widest bg-amber-500/10 text-amber-500">
                    {lang === 'ms' ? 'KEAHLIAN' : lang === 'zh' ? '会员注册' : lang === 'ta' ? 'உறுப்பினர்' : 'MEMBERSHIP'}
                  </span>
                  <h3 className="text-lg font-black tracking-tight leading-tight">{copy.joinTitle}</h3>
                </div>
              </div>
              <p className="text-xs opacity-70 leading-relaxed">{copy.joinDesc}</p>
            </div>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSchZH3A3wvlq2RQE47KorzGNLqDgX48zc4PP46kapENjnBiBA/viewform?fbzx=7657887268860346255&pli=1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-full text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-900 transition-all transform hover:scale-105 shadow-md shrink-0 uppercase tracking-widest font-mono"
            >
              <span>{copy.joinButton}</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5px]" />
            </a>
          </div>
        </div>

        {/* Security & Data Privacy Disclaimer Card */}
        <div className={`mt-12 border rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 max-w-2xl mx-auto ${isLight
          ? 'bg-amber-50/40 border-amber-200/50 text-amber-900 shadow-sm'
          : 'bg-amber-500/[0.02] border-amber-500/10 text-slate-300'
          }`}>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/10 text-amber-400'
            }`}>
            <ShieldAlert className="w-5.5 h-5.5" />
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className={`text-xs font-black tracking-wider uppercase ${isLight ? 'text-amber-850' : 'text-amber-400'}`}>
              {copy.disclaimerTitle}
            </h3>
            <p className="text-xs leading-relaxed opacity-75">
              {copy.disclaimerText}
            </p>
          </div>
        </div>

        {/* Technical Helpdesk Section */}
        <div className="mt-12 max-w-2xl mx-auto text-slate-800 dark:text-slate-100">
          <div className={`rounded-2xl border p-6 flex flex-col md:flex-row items-stretch justify-between gap-6 relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : theme === THEMES.EMERALD
                ? 'bg-gradient-to-br from-emerald-500/[0.04] to-transparent border-emerald-500/20 hover:border-emerald-500/30'
                : theme === THEMES.OLED
                  ? 'bg-black border-white/[0.08] hover:border-white/[0.12]'
                  : 'bg-gradient-to-br from-amber-500/[0.02] to-transparent border-white/[0.05] hover:border-white/[0.08]'
          }`}>
            
            {/* Left Column: Helpdesk Information */}
            <div className="flex-1 flex flex-col justify-between text-left space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black tracking-widest uppercase text-emerald-500 select-none">
                    {copy.helpdeskTag}
                  </span>
                </div>
                <h3 className={`text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {copy.helpdeskTitle}
                </h3>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400 opacity-70'}`}>
                  {copy.helpdeskDesc}
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <div className="flex -space-x-2">
                  <div className={`h-6 w-6 rounded-full bg-amber-500 text-slate-950 font-bold border ${theme === THEMES.OLED ? 'border-black' : 'border-white dark:border-slate-950'} flex items-center justify-center text-[9px] select-none shadow-sm`}>
                    CS
                  </div>
                  <div className={`h-6 w-6 rounded-full bg-blue-500 text-white font-bold border ${theme === THEMES.OLED ? 'border-black' : 'border-white dark:border-slate-950'} flex items-center justify-center text-[9px] select-none shadow-sm`}>
                    TE
                  </div>
                  <div className={`h-6 w-6 rounded-full bg-emerald-500 text-white font-bold border ${theme === THEMES.OLED ? 'border-black' : 'border-white dark:border-slate-950'} flex items-center justify-center text-[9px] select-none shadow-sm`}>
                    ST
                  </div>
                </div>
                <span className={`text-[9.5px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400 opacity-50'}`}>
                  {copy.helpdeskTeam}
                </span>
              </div>
            </div>

            {/* Right Column: CTA Block */}
            <div className="flex-1 flex flex-col justify-center items-stretch">
              <a
                href="https://t.me/STEMUSAS"
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border text-center transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 shadow-sm'
                    : theme === THEMES.EMERALD
                      ? 'bg-white/[0.015] border-emerald-500/15 hover:bg-white/[0.03] hover:border-emerald-500/30'
                      : theme === THEMES.OLED
                        ? 'bg-white/[0.015] border-white/[0.06] hover:bg-white/[0.035] hover:border-white/[0.1]'
                        : 'bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.035] hover:border-white/[0.08]'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Send className="w-5 h-5 fill-[#0088cc]/20" />
                </div>
                <div className="space-y-0.5">
                  <h4 className={`font-extrabold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {copy.helpdeskCta}
                  </h4>
                  <p className={`text-[10px] font-extrabold tracking-wider uppercase leading-none mt-1 ${
                    theme === THEMES.EMERALD ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    @STEMUSAS
                  </p>
                </div>
                <span className={`text-[9px] font-semibold leading-none ${isLight ? 'text-slate-500' : 'text-slate-400 opacity-40'}`}>
                  {copy.helpdeskResponse}
                </span>
              </a>
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 sm:mt-20 border-t border-slate-200/40 dark:border-white/5 pt-5 sm:pt-6 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 text-[9px] uppercase tracking-[0.25em] opacity-60">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-amber-500">STEM USAS</span>
            <span className="opacity-30 text-[8px]">-</span>
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>zis3c</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://www.instagram.com/persatuan.stem.usas/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={`h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 transition-all shadow-sm ${
                theme === THEMES.EMERALD
                  ? 'hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/30'
                  : 'hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/30'
              }`}
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.tiktok.com/@persatuan.stem.usas"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className={`h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 transition-all shadow-sm ${
                theme === THEMES.EMERALD
                  ? 'hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/30'
                  : 'hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/30'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.18 1.02.99 2.4 1.52 3.82 1.63V9.79c-1.39-.08-2.76-.56-3.88-1.42-.49-.38-.91-.84-1.25-1.37v9.06c.05 1.54-.37 3.08-1.2 4.35-1.12 1.68-2.95 2.82-4.97 3.12-1.62.29-3.31.05-4.78-.68-1.84-.88-3.25-2.52-3.86-4.51-.59-1.85-.38-3.92.58-5.61 1.02-1.78 2.8-3.03 4.84-3.41 1.02-.2 2.07-.15 3.08.13V8.87c-.8-.23-1.65-.28-2.48-.15-1.2.18-2.32.79-3.15 1.69-.99 1.04-1.47 2.47-1.31 3.89.14 1.48.92 2.83 2.11 3.69.96.72 2.14 1.09 3.34 1.05 1.22-.01 2.41-.49 3.27-1.36.81-.84 1.22-2 1.2-3.17V.02z" />
              </svg>
            </a>
            <a
              href="https://github.com/zis3c/USAS-Class-Timetable"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className={`h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 transition-all shadow-sm ${
                theme === THEMES.EMERALD
                  ? 'hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/30'
                  : 'hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/30'
              }`}
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </footer>

      </section>

      {/* Floating Scroll-to-Top Button */}
      <button
        onClick={() => {
          const lenis = (window as Window & { usasLenis?: { scrollTo: (target: number, options?: { duration?: number }) => void } }).usasLenis;
          if (lenis) {
            lenis.scrollTo(0, { duration: 1.5 });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 p-3 sm:p-4 rounded-full shadow-2xl border transition-all duration-300 transform backdrop-blur-[2px] ${
          scrollY > 300 ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'
        } ${
          isLight 
            ? 'bg-white/20 border-white/40 text-slate-800 hover:bg-white/40 hover:text-amber-600 shadow-slate-200/50' 
            : 'bg-[#0B1426]/20 border-amber-500/20 text-white hover:bg-[#0B1426]/40 hover:border-amber-500/50 hover:text-amber-400 shadow-black/50'
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

    </div>
  );
}
