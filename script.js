'use strict';

/* =========================================================
   БФ «Наш шлях» — скрипти сторінки
   ========================================================= */

/* ---------- Налаштування ---------- */

// TODO: ключ доступу Web3Forms (https://web3forms.com → вкажіть email фонду → ключ прийде листом).
// Поки тут плейсхолдер, форма працює в демо-режимі: нічого не відправляє, лише імітує успіх.
const WEB3FORMS_ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

// Куди відправляти форму: 'web3forms' (за замовчуванням) або 'telegram'.
// Альтернатива Web3Forms — заявки одразу в Telegram-чат фонду:
//   1) створіть бота через @BotFather і дізнайтеся chat_id групи/каналу, куди слати заявки;
//   2) задеплойте Cloudflare Worker з файлу telegram-worker.js (інструкція всередині файлу),
//      токен бота зберігається в секретах воркера, а не на сайті;
//   3) вкажіть URL воркера нижче й змініть FORM_PROVIDER на 'telegram'.
const FORM_PROVIDER = 'web3forms';
const TELEGRAM_WORKER_URL = 'https://nashshliakh-form.YOUR-SUBDOMAIN.workers.dev'; // TODO

const LANG_STORAGE_KEY = 'nsh-lang';
const DEFAULT_LANG = 'uk';

/* ---------- Дані фонду ----------
   Реквізити, контакти й посилання зібрані тут, в одному місці.
   Порожній рядок '' означає «даних поки немає»: відповідний рядок, кнопка чи цілий блок
   на сайті автоматично ховаються. Щойно впишете значення — блок з'явиться сам.
   У index.html елементи прив'язані атрибутами data-fund, data-fund-href, data-requires. */
const FUND = {
  legalName: { uk: '', en: '' },   // TODO: { uk: 'Благодійна організація «Благодійний фонд «Наш шлях»»', en: 'Charitable Organization …' }
  edrpou: '',                      // TODO: код ЄДРПОУ, напр. '12345678'

  // Реквізити в гривні (блок «Реквізити» з'являється, коли заповнено iban)
  bank: {
    recipient: '',                 // TODO: отримувач, як у банку, напр. 'БО «БФ «Наш шлях»»'
    iban: '',                      // TODO: 'UA00 0000 0000 0000 0000 0000 0000 0' (пробіли не обов'язкові)
    name: '',                      // TODO: банк, напр. 'АТ «Універсал Банк»'
    purpose: 'Благодійна допомога на статутну діяльність',
  },
  monobankJar: '',                 // TODO: ПОСТІЙНА банка фонду 'https://send.monobank.ua/jar/…' → QR-код і кнопка

  // З-за кордону (блок з'являється, коли заповнено paypal або swift.iban)
  paypal: '',                      // TODO: email PayPal
  swift: {
    beneficiary: '',               // TODO: назва латиницею, як у банку
    iban: '',                      // TODO: валютний IBAN
    bank: '',                      // TODO: напр. 'JSC UNIVERSAL BANK, Kyiv, Ukraine'
    bic: '',                       // TODO: SWIFT/BIC
    purpose: 'Charitable donation',
  },

  // Контакти
  phone: '',                       // TODO: '+380 44 000 00 00'
  email: '',                       // TODO: 'info@nashshliakh.org.ua'
  address: { uk: '', en: '' },     // TODO: { uk: 'м. Київ, вул. …', en: '… St., Kyiv, Ukraine' }

  // Посилання
  telegram: '',                    // TODO: 'https://t.me/…'
  reportsTelegram: '',             // TODO: Telegram-канал зі звітами
  reportsFolder: '',               // TODO: папка зі звітами (Google Drive, доступ за посиланням)
  instagram: '',                   // TODO
  facebook: '',                    // TODO
};

/* ---------- Тексти UA / EN ----------
   Ключі відповідають атрибутам у index.html:
   data-i18n="key"           → textContent
   data-i18n-html="key"      → innerHTML (лише довірені тексти з цього об'єкта)
   data-i18n-attr="attr:key" → атрибут (кілька — через «;»)
   Українські тексти продубльовано в HTML, щоб сторінка індексувалась і працювала без JS. */
const I18N = {
  uk: {
    'meta.title': 'БФ «Наш шлях» — разом до перемоги і відновлення',
    'meta.description': 'БФ «Наш шлях»: допомога військовим, переселенцям і прифронтовим громадам, реабілітація та протидія російській дезінформації. Прозора звітність.',

    'skip': 'Перейти до основного вмісту',
    'brand.short': 'БФ «Наш шлях»',
    'brand.home': 'БФ «Наш шлях» — на початок сторінки',
    'nav.label': 'Головне меню',
    'nav.about': 'Про нас',
    'nav.directions': 'Напрями',
    'nav.help': 'Як допомогти',
    'nav.reports': 'Звітність',
    'nav.faq': 'FAQ',
    'nav.contact': 'Контакти',
    'header.cta': 'Допомогти',
    'lang.label': 'Мова сайту',
    'menu.open': 'Відкрити меню',
    'menu.close': 'Закрити меню',
    'a11y.newTab': '(відкриється в новій вкладці)',

    'hero.eyebrow': 'З 2023 року · Київ', // TODO: рік заснування і місто
    'hero.titleSmall': 'Благодійний фонд',
    'hero.title': '«Наш шлях»',
    'hero.mission': 'Разом проходимо шлях до перемоги і відновлення.',
    'hero.lead': 'Допомагаємо військовим, переселенцям і прифронтовим громадам — швидко, адресно та з повною звітністю за кожну гривню. Також здійснюємо заходи проти дезінформації, кібератак та пропаганди з боку Росії, спрямованих на деморалізацію населення, спотворення реальності та руйнацію довіри до державних інституцій.',
    'hero.donate': 'Підтримати фонд',
    'hero.volunteer': 'Стати волонтером',
    'hero.trust1': 'Офіційно зареєстрований фонд',
    'hero.trust2': 'Звіт за кожним збором',
    'hero.trust3': 'Перевірені запити',
    'hero.artAlt': 'Ілюстрація: дорога крізь пагорби до прапора України на тлі сонця',

    'about.eyebrow': 'Про нас',
    'about.title': 'Почали з одного бусика — ідемо далі разом',
    'about.p1': 'Фонд «Наш шлях» заснували у 2023 році волонтери та підприємці з Києва, які з перших днів повномасштабного вторгнення возили допомогу на схід. Сьогодні це команда волонтерів в Україні та за кордоном.',
    'about.p2': 'Ми закриваємо конкретні запити — від автомобілів і дронів до ліків і генераторів — і звітуємо за кожну гривню.',
    'about.v1t': 'Адресність',
    'about.v1d': 'Працюємо лише з підтвердженими запитами.',
    'about.v2t': 'Прозорість',
    'about.v2d': 'Публікуємо чеки, виписки й фотозвіти.',
    'about.v3t': 'Швидкість',
    'about.v3d': 'Реагуємо на запити без зайвої бюрократії.',
    'about.photo': 'Чекаємо фото команди від фотографа',
    'about.caption': 'Команда фонду на складі у Києві',

    'dir.eyebrow': 'Напрями діяльності',
    'dir.title': 'Де ми допомагаємо',
    'dir.lead': 'Чотири напрями, у яких ми маємо досвід, команду й перевірених партнерів.',
    'dir.c1t': 'Допомога військовим',
    'dir.c1d': 'Транспорт, зв\'язок, дрони, тактична медицина та спорядження для підрозділів Сил оборони — за підтвердженими запитами.',
    'dir.c2t': 'Підтримка переселенців',
    'dir.c2d': 'Продуктові й гігієнічні набори, допомога з житлом, юридичні консультації та психологічна підтримка для внутрішньо переміщених родин.',
    'dir.c3t': 'Прифронтові громади',
    'dir.c3d': 'Гуманітарна допомога туди, куди складно доїхати іншим: вода, їжа, ліки, генератори та матеріали для ремонту.',
    'dir.c4t': 'Реабілітація',
    'dir.c4d': 'Протезування, реабілітаційні курси та повернення до активного життя для ветеранів і цивільних, які постраждали від війни.',

    'how.eyebrow': 'Як ми працюємо',
    'how.title': 'Від запиту до звіту',
    'how.s1t': 'Отримуємо запит',
    'how.s1d': 'Від підрозділу, громади чи родини — з підтвердженням реальної потреби.',
    'how.s2t': 'Перевіряємо',
    'how.s2d': 'Уточнюємо деталі, документи й контакти отримувача.',
    'how.s3t': 'Закуповуємо й доставляємо',
    'how.s3d': 'Шукаємо найкращу ціну та передаємо допомогу особисто.',
    'how.s4t': 'Звітуємо',
    'how.s4d': 'Публікуємо фото, чеки й виписки по кожній передачі.',



    'help.eyebrow': 'Як допомогти',
    'help.title': 'Кожен внесок наближає перемогу',
    'help.lead': 'Оберіть зручний спосіб. Реквізити можна скопіювати одним натиском.',
    'help.reqTitle': 'Реквізити в гривні',
    'help.recipient': 'Отримувач',
    'help.edrpou': 'ЄДРПОУ',
    'help.bank': 'Банк',
    'help.purpose': 'Призначення платежу',
    'help.qrTitle': 'Швидкий донат',
    'help.qrAlt': 'QR-код для переходу до банки Monobank',
    'help.qrHint': 'Наведіть камеру телефону — відкриється банка Monobank.',
    'help.shareTitle': 'Розкажіть друзям',
    'help.shareText': 'Поширення — теж допомога: що більше людей знають про фонд, то більше ми можемо зробити разом.',
    'help.shareBtn': 'Поділитися',
    'help.leadNoPay': 'Долучайтеся так, як вам зручно: часом, навичками, ресурсами чи просто розповіддю про фонд.',
    'help.jarBtn': 'Відкрити банку',
    'help.w1t': 'Станьте волонтером',
    'help.w1d': 'Допомагайте з логістикою, закупівлями, комунікаціями чи на складі — у зручний для вас час.',
    'help.w1btn': 'Залишити заявку',
    'help.w2t': 'Станьте партнером',
    'help.w2d': 'Для компаній та організацій: спільні проєкти, корпоративна допомога, товари чи послуги.',
    'help.w2btn': 'Написати нам',

    'copy.btn': 'Скопіювати',
    'copy.aria': 'Скопіювати: {label}',
    'copy.done': 'Скопійовано',
    'copy.fail': 'Не вдалося скопіювати — виділіть текст вручну',

    'share.title': 'БФ «Наш шлях»',
    'share.text': 'Підтримайте благодійний фонд «Наш шлях» — разом до перемоги і відновлення.',
    'share.copied': 'Посилання скопійовано',

    'intl.title': 'Допомога з-за кордону: PayPal і SWIFT',
    'intl.sub': 'Для донатів у USD та EUR',
    'intl.paypalNote': 'Оберіть «Надіслати друзям і родині», щоб уникнути додаткових комісій.',
    'intl.swiftNote': 'Банки-кореспонденти для USD та EUR відрізняються — повні інструкції надішлемо на запит.',

    'reports.eyebrow': 'Звітність',
    'reports.title': 'Прозорість — наш принцип',
    'reports.text': 'Після кожного закритого збору публікуємо фото передачі, чеки та банківські виписки. Щокварталу — фінансовий звіт фонду. Довіра будується відкритістю.',
    'reports.tg': 'Telegram-канал зі звітами',
    'reports.folder': 'Папка зі звітами',
    'reports.l1': 'Фото- та відеозвіти з передачі допомоги',
    'reports.l2': 'Чеки, накладні та банківські виписки',
    'reports.l3': 'Щоквартальні фінансові звіти',
    'reports.l4': 'Подяки та листи від отримувачів',

    'faq.eyebrow': 'FAQ',
    'faq.title': 'Часті питання',
    'faq.q2': 'Чи даєте звіти?',
    'faq.a2': 'Так. За кожним закритим збором публікуємо фотозвіт, чеки та виписки в Telegram-каналі й у відкритій папці зі звітами. Щокварталу — загальний фінансовий звіт фонду.',
    'faq.q3': 'Як стати волонтером?',
    'faq.a3': 'Заповніть форму нижче й оберіть «Хочу допомогти». Ми зателефонуємо протягом двох робочих днів, розповімо про відкриті задачі й підберемо ту, що відповідає вашому часу та навичкам.',
    'faq.q4': 'Чи можна допомогти з-за кордону?',
    'faq.a4': 'Так: через PayPal, міжнародний SWIFT-переказ або банку Monobank з картки будь-якого банку. Реквізити — у розділі «Як допомогти». Для корпоративного партнерства напишіть нам.',
    'faq.a4NoPay': 'Так. Напишіть нам через форму — підкажемо, як найзручніше допомогти з-за кордону, або обговоримо корпоративне партнерство.',
    'faq.q5': 'Як отримати допомогу?',
    'faq.a5': 'Залиште звернення через форму з типом «Потрібна допомога» та коротко опишіть ситуацію. Для підрозділів потрібен офіційний запит від командира. Ми відповімо протягом 3 робочих днів.',

    'contact.eyebrow': 'Зворотний зв\'язок',
    'contact.title': 'Напишіть нам',
    'contact.lead': 'Хочете долучитися, потребуєте допомоги чи маєте ідею для партнерства — залиште повідомлення, і ми відповімо найближчим часом.',

    'form.name': 'Ім\'я',
    'form.contact': 'Телефон або email',
    'form.contactPh': '+380… або name@example.com',
    'form.contactHint': 'Вкажіть, як вам зручніше отримати відповідь.',
    'form.type': 'Тип звернення',
    'form.typeHelp': 'Хочу допомогти',
    'form.typeNeed': 'Потрібна допомога',
    'form.typePartner': 'Партнерство',
    'form.typeOther': 'Інше',
    'form.message': 'Повідомлення',
    'form.consent': 'Я погоджуюсь на обробку персональних даних відповідно до <button type="button" class="link-btn" data-open-privacy>політики конфіденційності</button> <span class="req-mark" aria-hidden="true">*</span>',
    'form.required': '* — обов\'язкові поля',
    'form.submit': 'Надіслати',
    'form.sending': 'Надсилаємо…',
    'form.success': 'Дякуємо! Повідомлення надіслано — ми зв\'яжемося з вами найближчим часом.',
    'form.demo': 'Демо-режим: форма ще не підключена, повідомлення не відправлено. Додайте ключ Web3Forms у script.js.',
    'form.error': 'Не вдалося надіслати повідомлення. Перевірте з\'єднання і спробуйте ще раз трохи пізніше.',
    'form.subject': 'Нове звернення з сайту: {type}',

    'err.nameRequired': 'Вкажіть, будь ласка, ваше ім\'я.',
    'err.nameShort': 'Ім\'я має містити щонайменше 2 символи.',
    'err.contactRequired': 'Вкажіть телефон або email, щоб ми могли відповісти.',
    'err.contactInvalid': 'Перевірте формат: +380 67 123 45 67 або name@example.com.',
    'err.messageRequired': 'Напишіть, будь ласка, повідомлення.',
    'err.messageShort': 'Повідомлення має містити щонайменше 10 символів.',
    'err.consent': 'Потрібна ваша згода на обробку персональних даних.',

    'footer.contacts': 'Контакти',
    'footer.legal': 'Юридична інформація',
    'footer.rights': 'Усі права захищено.',
    'footer.privacy': 'Політика конфіденційності',

    'modal.close': 'Закрити',
    'privacy.title': 'Політика конфіденційності',
    'privacy.body':
      '<p>Благодійний фонд «Наш шлях» поважає вашу приватність і обробляє персональні дані відповідно до Закону України «Про захист персональних даних».</p>' +
      '<h3>Які дані ми збираємо</h3>' +
      '<p>Ім\'я, номер телефону або email і текст повідомлення, які ви добровільно залишаєте у формі зворотного зв\'язку.</p>' +
      '<h3>Навіщо</h3>' +
      '<p>Лише для того, щоб відповісти на ваше звернення, організувати допомогу або волонтерську участь. Ми не надсилаємо реклами й не продаємо дані третім особам.</p>' +
      '<h3>Зберігання та передача</h3>' +
      '<p>Повідомлення з форми передаються через сервіс Web3Forms на пошту фонду. Дані зберігаються не довше, ніж це потрібно для опрацювання звернення, але не більше 3 років.</p>' +
      '<h3>Ваші права</h3>' +
      '<p>Ви можете попросити переглянути, виправити або видалити свої дані, написавши нам через форму зворотного зв\'язку на цьому сайті.</p>' +
      '<p class="modal__meta">Редакція від 1 жовтня 2026 року.</p>',
  },

  en: {
    'meta.title': 'Nash Shliakh Charitable Foundation — together towards victory and recovery',
    'meta.description': 'Nash Shliakh Charitable Foundation: aid to the military, displaced families and frontline communities, rehabilitation, and countering Russian disinformation. Transparent reporting.',

    'skip': 'Skip to main content',
    'brand.short': 'Nash Shliakh CF',
    'brand.home': 'Nash Shliakh Charitable Foundation — back to top',
    'nav.label': 'Main menu',
    'nav.about': 'About',
    'nav.directions': 'What we do',
    'nav.help': 'How to help',
    'nav.reports': 'Reports',
    'nav.faq': 'FAQ',
    'nav.contact': 'Contact',
    'header.cta': 'Help now',
    'lang.label': 'Site language',
    'menu.open': 'Open menu',
    'menu.close': 'Close menu',
    'a11y.newTab': '(opens in a new tab)',

    'hero.eyebrow': 'Since 2023 · Kyiv',
    'hero.titleSmall': 'Charitable Foundation',
    'hero.title': 'Nash Shliakh',
    'hero.mission': 'Together we walk the path to victory and recovery.',
    'hero.lead': 'We help Ukrainian defenders, displaced families and frontline communities — quickly, directly, and with a full report for every hryvnia. We also counter Russian disinformation, cyberattacks and propaganda aimed at demoralising people, distorting reality and destroying trust in state institutions.',
    'hero.donate': 'Support the foundation',
    'hero.volunteer': 'Become a volunteer',
    'hero.trust1': 'Officially registered charity',
    'hero.trust2': 'A report for every fundraiser',
    'hero.trust3': 'Verified requests only',
    'hero.artAlt': 'Illustration: a road winding through hills to a Ukrainian flag against the sun',

    'about.eyebrow': 'About us',
    'about.title': 'We started with one van — and keep going together',
    'about.p1': 'Nash Shliakh (“Our Path”) was founded in 2023 by volunteers and entrepreneurs from Kyiv who had been driving aid to the east since the first days of the full-scale invasion. Today we are a team of volunteers in Ukraine and abroad.',
    'about.p2': 'We fulfil specific requests — from vehicles and drones to medicine and generators — and report on every hryvnia.',
    'about.v1t': 'Targeted',
    'about.v1d': 'We only work with verified requests.',
    'about.v2t': 'Transparent',
    'about.v2d': 'We publish receipts, statements and photo reports.',
    'about.v3t': 'Fast',
    'about.v3d': 'We respond to requests without red tape.',
    'about.photo': 'Team photo coming soon from our photographer',
    'about.caption': 'Our team at the warehouse in Kyiv',

    'dir.eyebrow': 'What we do',
    'dir.title': 'Where we help',
    'dir.lead': 'Four areas where we have experience, a team and trusted partners.',
    'dir.c1t': 'Support for the military',
    'dir.c1d': 'Vehicles, communications, drones, tactical medicine and gear for units of the Defence Forces — based on verified requests.',
    'dir.c2t': 'Displaced families',
    'dir.c2d': 'Food and hygiene kits, help with housing, legal advice and psychological support for internally displaced families.',
    'dir.c3t': 'Frontline communities',
    'dir.c3d': 'Humanitarian aid where others struggle to reach: water, food, medicine, generators and repair materials.',
    'dir.c4t': 'Rehabilitation',
    'dir.c4d': 'Prosthetics, rehabilitation programmes and a return to active life for veterans and civilians affected by the war.',

    'how.eyebrow': 'How we work',
    'how.title': 'From request to report',
    'how.s1t': 'We receive a request',
    'how.s1d': 'From a unit, a community or a family — with confirmation of a real need.',
    'how.s2t': 'We verify it',
    'how.s2d': 'We check the details, documents and the recipient’s contacts.',
    'how.s3t': 'We buy and deliver',
    'how.s3d': 'We look for the best price and hand over the aid in person.',
    'how.s4t': 'We report',
    'how.s4d': 'We publish photos, receipts and statements for every handover.',



    'help.eyebrow': 'How to help',
    'help.title': 'Every donation brings victory closer',
    'help.lead': 'Choose the way that suits you. Bank details can be copied with one tap.',
    'help.reqTitle': 'Bank details (UAH)',
    'help.recipient': 'Recipient',
    'help.edrpou': 'EDRPOU code',
    'help.bank': 'Bank',
    'help.purpose': 'Payment purpose',
    'help.qrTitle': 'Quick donation',
    'help.qrAlt': 'QR code linking to the Monobank donation jar',
    'help.qrHint': 'Point your phone camera at the code to open the Monobank jar.',
    'help.shareTitle': 'Tell your friends',
    'help.shareText': 'Sharing helps too: the more people know about the foundation, the more we can do together.',
    'help.shareBtn': 'Share',
    'help.leadNoPay': 'Join in the way that suits you: with your time, skills, resources, or simply by spreading the word.',
    'help.jarBtn': 'Open the jar',
    'help.w1t': 'Become a volunteer',
    'help.w1d': 'Help with logistics, procurement, communications or at the warehouse — whenever it suits you.',
    'help.w1btn': 'Apply',
    'help.w2t': 'Become a partner',
    'help.w2d': 'For companies and organisations: joint projects, corporate support, goods or services.',
    'help.w2btn': 'Write to us',

    'copy.btn': 'Copy',
    'copy.aria': 'Copy: {label}',
    'copy.done': 'Copied',
    'copy.fail': 'Could not copy — please select the text manually',

    'share.title': 'Nash Shliakh Charitable Foundation',
    'share.text': 'Support Nash Shliakh Charitable Foundation — together towards victory and recovery.',
    'share.copied': 'Link copied',

    'intl.title': 'Giving from abroad: PayPal and SWIFT',
    'intl.sub': 'For donations in USD and EUR',
    'intl.paypalNote': 'Choose “Send to friends and family” to avoid extra fees.',
    'intl.swiftNote': 'Correspondent banks differ for USD and EUR — we will send full instructions on request.',

    'reports.eyebrow': 'Reports',
    'reports.title': 'Transparency is our principle',
    'reports.text': 'After every completed fundraiser we publish handover photos, receipts and bank statements. Every quarter — a financial report of the foundation. Trust is built on openness.',
    'reports.tg': 'Telegram channel with reports',
    'reports.folder': 'Reports folder',
    'reports.l1': 'Photo and video reports of every handover',
    'reports.l2': 'Receipts, invoices and bank statements',
    'reports.l3': 'Quarterly financial reports',
    'reports.l4': 'Thank-you letters from recipients',

    'faq.eyebrow': 'FAQ',
    'faq.title': 'Frequently asked questions',
    'faq.q2': 'Do you publish reports?',
    'faq.a2': 'Yes. For every completed fundraiser we publish a photo report, receipts and statements in our Telegram channel and in the public reports folder. Every quarter — an overall financial report.',
    'faq.q3': 'How do I become a volunteer?',
    'faq.a3': 'Fill in the form below and choose “I want to help”. We will call you within two working days, tell you about open tasks and find one that fits your time and skills.',
    'faq.q4': 'Can I help from abroad?',
    'faq.a4': 'Yes: via PayPal, an international SWIFT transfer, or the Monobank jar using a card from any bank. Details are in the “How to help” section. For corporate partnerships, please write to us.',
    'faq.a4NoPay': 'Yes. Write to us via the form — we will suggest the most convenient way to help from abroad or discuss a corporate partnership.',
    'faq.q5': 'How can I get help?',
    'faq.a5': 'Send a request via the form with the type “I need help” and briefly describe your situation. Military units need an official request from the commander. We reply within 3 working days.',

    'contact.eyebrow': 'Get in touch',
    'contact.title': 'Write to us',
    'contact.lead': 'Want to join, need help or have a partnership idea? Leave a message and we will get back to you soon.',

    'form.name': 'Name',
    'form.contact': 'Phone or email',
    'form.contactPh': '+380… or name@example.com',
    'form.contactHint': 'Tell us how you prefer to receive a reply.',
    'form.type': 'Type of request',
    'form.typeHelp': 'I want to help',
    'form.typeNeed': 'I need help',
    'form.typePartner': 'Partnership',
    'form.typeOther': 'Other',
    'form.message': 'Message',
    'form.consent': 'I agree to the processing of my personal data in accordance with the <button type="button" class="link-btn" data-open-privacy>privacy policy</button> <span class="req-mark" aria-hidden="true">*</span>',
    'form.required': '* — required fields',
    'form.submit': 'Send',
    'form.sending': 'Sending…',
    'form.success': 'Thank you! Your message has been sent — we will get back to you soon.',
    'form.demo': 'Demo mode: the form is not connected yet, nothing was sent. Add a Web3Forms key in script.js.',
    'form.error': 'Your message could not be sent. Please check your connection and try again a bit later.',
    'form.subject': 'New website request: {type}',

    'err.nameRequired': 'Please enter your name.',
    'err.nameShort': 'Name must be at least 2 characters long.',
    'err.contactRequired': 'Please enter a phone number or email so we can reply.',
    'err.contactInvalid': 'Please check the format: +380 67 123 45 67 or name@example.com.',
    'err.messageRequired': 'Please write a message.',
    'err.messageShort': 'Message must be at least 10 characters long.',
    'err.consent': 'We need your consent to process personal data.',

    'footer.contacts': 'Contacts',
    'footer.legal': 'Legal information',
    'footer.rights': 'All rights reserved.',
    'footer.privacy': 'Privacy policy',

    'modal.close': 'Close',
    'privacy.title': 'Privacy policy',
    'privacy.body':
      '<p>Nash Shliakh Charitable Foundation respects your privacy and processes personal data in accordance with the Law of Ukraine “On Personal Data Protection”.</p>' +
      '<h3>What we collect</h3>' +
      '<p>Your name, phone number or email, and the message you voluntarily submit through the contact form.</p>' +
      '<h3>Why</h3>' +
      '<p>Only to reply to your request and to organise help or volunteering. We do not send advertising and never sell data to third parties.</p>' +
      '<h3>Storage and transfer</h3>' +
      '<p>Form messages are delivered to the foundation’s mailbox via the Web3Forms service. Data is kept only as long as needed to handle your request, and no longer than 3 years.</p>' +
      '<h3>Your rights</h3>' +
      '<p>You can ask us to view, correct or delete your data by writing to us via the contact form on this website.</p>' +
      '<p class="modal__meta">Version of 1 October 2026.</p>',
  },
};

/* ---------- Утиліти ---------- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let currentLang = DEFAULT_LANG;

function t(key, vars) {
  let str = I18N[currentLang][key] ?? I18N[DEFAULT_LANG][key] ?? key;
  if (vars) str = str.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
  return str;
}

function readStoredLang() {
  try { return localStorage.getItem(LANG_STORAGE_KEY); } catch { return null; }
}

function storeLang(lang) {
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch { /* приватний режим тощо */ }
}

/* ---------- Дані фонду: підстановка й приховування блоків ---------- */

function fundValue(path) {
  let v = path.split('.').reduce((obj, key) => obj?.[key], FUND);
  if (v && typeof v === 'object') v = v[currentLang] || v[DEFAULT_LANG];
  return typeof v === 'string' ? v.trim() : '';
}

function formatFundValue(path, value, format) {
  if (path.endsWith('iban')) return value.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
  if (format === 'handle') return `@${value.replace(/\/+$/, '').split('/').pop()}`;
  return value;
}

function hasPayments() {
  return ['bank.iban', 'monobankJar', 'paypal', 'swift.iban'].some((p) => fundValue(p));
}

function renderFund() {
  $$('[data-requires]').forEach((el) => {
    el.hidden = !el.dataset.requires.split(/\s+/).every(fundValue);
  });
  $$('[data-requires-any]').forEach((el) => {
    el.hidden = !el.dataset.requiresAny.split(/\s+/).some(fundValue);
  });
  $$('[data-fund]').forEach((el) => {
    const path = el.dataset.fund;
    el.textContent = formatFundValue(path, fundValue(path), el.dataset.fundFormat);
  });
  $$('[data-fund-href]').forEach((el) => {
    const href = el.dataset.fundHref.replace(/\{([\w.]+)\}/g, (_, path) => fundValue(path));
    if (href.startsWith('tel:')) el.href = `tel:${href.slice(4).replace(/[^\d+]/g, '')}`;
    else el.href = href;
  });
  $$('[data-fund-copy]').forEach((el) => {
    const path = el.dataset.fundCopy;
    const value = fundValue(path);
    el.dataset.copy = path.endsWith('iban') ? value.replace(/\s+/g, '') : value;
  });
}

function initFund() {
  // Тексти з двома варіантами: з реквізитами (data-i18n-pay) і без них (data-i18n)
  if (hasPayments()) {
    $$('[data-i18n-pay]').forEach((el) => { el.dataset.i18n = el.dataset.i18nPay; });
  }
  renderFund();
  langListeners.push(renderFund); // адреса й юридична назва мають UA/EN-версії
  updateStructuredData();
}

// Доповнює розмітку schema.org тим, що вже є в FUND
function updateStructuredData() {
  const script = $('#ld-ngo');
  if (!script) return;
  try {
    const data = JSON.parse(script.textContent);
    const legalName = FUND.legalName.uk.trim();
    if (legalName) data.legalName = legalName;
    if (FUND.edrpou.trim()) data.taxID = FUND.edrpou.trim();
    if (FUND.email.trim()) data.email = FUND.email.trim();
    if (FUND.phone.trim()) data.telephone = FUND.phone.replace(/[^\d+]/g, '');
    if (FUND.address.uk.trim()) data.address.streetAddress = FUND.address.uk.trim();
    const sameAs = [FUND.telegram, FUND.instagram, FUND.facebook].map((u) => u.trim()).filter(Boolean);
    if (sameAs.length) data.sameAs = sameAs;
    script.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.warn('JSON-LD не оновлено:', err);
  }
}

/* ---------- Мова ---------- */

const langListeners = [];

function applyLang(lang) {
  currentLang = I18N[lang] ? lang : DEFAULT_LANG;
  document.documentElement.lang = currentLang;
  document.title = t('meta.title');
  $('meta[name="description"]')?.setAttribute('content', t('meta.description'));

  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  $$('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });

  $$('.lang__btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === currentLang));
  });

  langListeners.forEach((fn) => fn());
}

function initLang() {
  const stored = readStoredLang();
  applyLang(stored && I18N[stored] ? stored : DEFAULT_LANG);

  $$('.lang__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.lang === currentLang) return;
      applyLang(btn.dataset.lang);
      storeLang(currentLang);
    });
  });
}

/* ---------- Тост ---------- */

let toastTimer;

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

/* ---------- Копіювання ---------- */

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* переходимо до запасного варіанта */ }

  const active = document.activeElement;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  active?.focus?.();
  return ok;
}

function initCopy() {
  const buttons = $$('.copy-btn');

  const updateLabels = () => {
    buttons.forEach((btn) => {
      const label = btn.closest('.req__row')?.querySelector('dt')?.textContent.trim() ?? '';
      btn.setAttribute('aria-label', t('copy.aria', { label }));
    });
  };
  updateLabels();
  langListeners.push(updateLabels);

  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.copy);
      showToast(ok ? t('copy.done') : t('copy.fail'));
      if (!ok) return;
      btn.classList.add('is-copied');
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(() => btn.classList.remove('is-copied'), 1800);
    });
  });
}

/* ---------- Поділитися ---------- */

function getShareUrl() {
  if (location.protocol.startsWith('http')) return location.origin + location.pathname;
  return $('link[rel="canonical"]')?.href ?? location.href;
}

function initShare() {
  $$('[data-share]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const data = { title: t('share.title'), text: t('share.text'), url: getShareUrl() };
      if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
        try {
          await navigator.share(data);
          return;
        } catch (err) {
          if (err.name === 'AbortError') return; // користувач закрив вікно
        }
      }
      const ok = await copyText(data.url);
      showToast(ok ? t('share.copied') : t('copy.fail'));
    });
  });
}

/* ---------- Хедер і меню ---------- */

function initHeader() {
  const header = $('.header');
  const burger = $('.burger');
  const nav = $('#site-nav');
  const desktop = window.matchMedia('(min-width: 1120px)');
  const outside = [$('main'), $('footer')];

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setBurgerLabel = () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-label', t(open ? burger.dataset.labelClose : burger.dataset.labelOpen));
  };

  const setMenu = (open, { focusBurger = false } = {}) => {
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
    outside.forEach((el) => { if (el) el.inert = open; });
    setBurgerLabel();
    if (open) nav.querySelector('a')?.focus();
    else if (focusBurger) burger.focus();
  };

  setBurgerLabel();
  langListeners.push(setBurgerLabel);

  burger.addEventListener('click', () => {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });

  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false, { focusBurger: true });
  });

  desktop.addEventListener('change', (e) => { if (e.matches) setMenu(false); });
}

function initActiveNav() {
  const links = $$('.nav__link');
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if (!('IntersectionObserver' in window) || !sections.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => {
        a.classList.remove('is-active');
        a.removeAttribute('aria-current');
      });
      const link = byId.get(entry.target.id);
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach((s) => io.observe(s));
}

/* ---------- Анімації появи ---------- */

function initReveal() {
  const items = $$('.reveal');

  // Невелика затримка для карток в одному ряду
  $$('.cards, .steps__list, .faq').forEach((group) => {
    $$('.reveal', group).forEach((el, i) => el.style.setProperty('--delay', `${i * 80}ms`));
  });

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  items.forEach((el) => io.observe(el));
}

/* ---------- QR-код ---------- */

function initQR() {
  const box = $('.qr__code');
  const url = fundValue('monobankJar');
  // Бібліотека qrcode-generator (cdnjs). Без неї лишається SVG-плейсхолдер з HTML.
  if (!box || !url || typeof window.qrcode !== 'function') return;

  try {
    const qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const count = qr.getModuleCount();
    const size = count + 2; // 1 модуль «тихої зони» з кожного боку, решту дає padding
    let d = '';
    for (let r = 0; r < count; r += 1) {
      for (let c = 0; c < count; c += 1) {
        if (qr.isDark(r, c)) d += `M${c + 1} ${r + 1}h1v1h-1z`;
      }
    }
    box.innerHTML =
      `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false" shape-rendering="crispEdges">` +
      `<rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#0B2A5B"/></svg>`;
  } catch (err) {
    console.warn('QR-код не згенеровано:', err);
  }
}

/* ---------- Модальне вікно ---------- */

function initPrivacyDialog() {
  const dialog = $('#privacy-dialog');
  if (!dialog) return;

  const open = () => {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };
  const close = () => {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  };

  // Делегування: кнопки всередині i18n-HTML перестворюються при зміні мови
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-privacy]')) {
      e.preventDefault();
      open();
    } else if (e.target.closest('[data-close-dialog]')) {
      close();
    }
  });

  // Клік по затемненому фону
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
}

/* ---------- Форма ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?\d{10,13}$/;

function contactKind(value) {
  const v = value.trim();
  if (EMAIL_RE.test(v)) return 'email';
  if (PHONE_RE.test(v.replace(/[\s()-]/g, ''))) return 'phone';
  return null;
}

const VALIDATORS = {
  name: (el) => {
    const v = el.value.trim();
    if (!v) return 'err.nameRequired';
    if (v.length < 2) return 'err.nameShort';
    return '';
  },
  contact: (el) => {
    const v = el.value.trim();
    if (!v) return 'err.contactRequired';
    if (!contactKind(v)) return 'err.contactInvalid';
    return '';
  },
  message: (el) => {
    const v = el.value.trim();
    if (!v) return 'err.messageRequired';
    if (v.length < 10) return 'err.messageShort';
    return '';
  },
  consent: (el) => (el.checked ? '' : 'err.consent'),
};

function setFieldError(el, key) {
  const errEl = document.getElementById(`${el.id}-err`);
  if (key) {
    el.setAttribute('aria-invalid', 'true');
    el.dataset.errorKey = key;
    if (errEl) errEl.textContent = t(key);
  } else {
    el.removeAttribute('aria-invalid');
    delete el.dataset.errorKey;
    if (errEl) errEl.textContent = '';
  }
}

function validateField(el) {
  const key = VALIDATORS[el.name]?.(el) ?? '';
  setFieldError(el, key);
  return !key;
}

async function sendViaWeb3Forms(fields) {
  const kind = contactKind(fields.contact);
  const payload = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: t('form.subject', { type: fields.typeLabel }),
    from_name: 'Сайт БФ «Наш шлях»',
    name: fields.name,
    contact: fields.contact,
    type: fields.typeLabel,
    message: fields.message,
    language: currentLang,
    botcheck: '',
  };
  if (kind === 'email') payload.email = fields.contact; // Web3Forms підставить його як Reply-To
  if (kind === 'phone') payload.phone = fields.contact;

  const res = await fetchWithTimeout(WEB3FORMS_ENDPOINT, payload);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || `HTTP ${res.status}`);
}

async function sendViaTelegramWorker(fields) {
  const res = await fetchWithTimeout(TELEGRAM_WORKER_URL, {
    name: fields.name,
    contact: fields.contact,
    type: fields.typeLabel,
    message: fields.message,
    language: currentLang,
    botcheck: '',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
}

async function fetchWithTimeout(url, body, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function initForm() {
  const form = $('#contact-form');
  if (!form) return;
  const status = $('#form-status');
  const submit = $('.form__submit', form);
  const submitText = $('.form__submit-text', form);
  const typeSelect = form.elements.type;
  const fields = ['name', 'contact', 'message', 'consent'].map((n) => form.elements[n]);
  let statusKey = '';
  let sending = false;

  const setStatus = (key, kind) => {
    statusKey = key;
    status.className = `form__status${kind ? ` is-${kind}` : ''}`;
    status.textContent = key ? t(key) : '';
  };

  const setSending = (on) => {
    sending = on;
    form.classList.toggle('is-sending', on);
    form.setAttribute('aria-busy', String(on));
    submit.disabled = on;
    submitText.textContent = t(on ? 'form.sending' : 'form.submit');
  };

  // Перекладаємо вже показані помилки/статус при зміні мови
  langListeners.push(() => {
    fields.forEach((el) => { if (el.dataset.errorKey) setFieldError(el, el.dataset.errorKey); });
    if (statusKey) status.textContent = t(statusKey);
    if (sending) submitText.textContent = t('form.sending');
  });

  fields.forEach((el) => {
    el.addEventListener('blur', () => { if (el.type !== 'checkbox' && el.value.trim()) validateField(el); });
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
      if (el.hasAttribute('aria-invalid')) validateField(el);
    });
  });

  // Кнопки «Стати волонтером» тощо попередньо обирають тип звернення
  $$('[data-topic]').forEach((link) => {
    link.addEventListener('click', () => { typeSelect.value = link.dataset.topic; });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    setStatus('', '');

    // Honeypot заповнений → це бот. Удаємо успіх і нічого не відправляємо.
    if (form.elements.botcheck.value) {
      form.reset();
      setStatus('form.success', 'success');
      return;
    }

    const invalid = fields.filter((el) => !validateField(el));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const data = {
      name: form.elements.name.value.trim(),
      contact: form.elements.contact.value.trim(),
      message: form.elements.message.value.trim(),
      typeLabel: typeSelect.options[typeSelect.selectedIndex].text,
    };

    setSending(true);
    try {
      if (FORM_PROVIDER === 'telegram') {
        await sendViaTelegramWorker(data);
      } else if (WEB3FORMS_ACCESS_KEY.startsWith('YOUR_')) {
        console.warn('Web3Forms: задайте WEB3FORMS_ACCESS_KEY у script.js — зараз форма в демо-режимі.');
        await new Promise((r) => setTimeout(r, 900));
        form.reset();
        setStatus('form.demo', 'success');
        return;
      } else {
        await sendViaWeb3Forms(data);
      }
      form.reset();
      setStatus('form.success', 'success');
    } catch (err) {
      console.error('Помилка надсилання форми:', err);
      setStatus('form.error', 'error');
    } finally {
      setSending(false);
    }
  });
}

/* ---------- «Шлях»: хвиляста доріжка між секціями ---------- */

function initJourney() {
  const main = $('#main');
  const svg = $('.journey', main);
  if (!svg) return;
  const track = $('.journey__track', svg);
  const trail = $('.journey__trail', svg);
  const stopsGroup = $('.journey__stops', svg);
  const NS = 'http://www.w3.org/2000/svg';

  let length = 0;
  let samples = []; // [довжина, y] уздовж шляху — щоб малювати доріжку до поточної позиції скролу
  let stops = [];

  const build = () => {
    const sections = [...main.children].filter((el) => el.tagName === 'SECTION');
    const container = $('.container', main);
    if (sections.length < 2 || !container) return;

    const W = main.clientWidth;
    const H = main.scrollHeight;
    const contentLeft = container.getBoundingClientRect().left - main.getBoundingClientRect().left
      + parseFloat(getComputedStyle(container).paddingLeft);
    const inset = Math.max(6, contentLeft / 2); // посередині бічного поля
    const xs = [inset, W - inset];
    const sectionY = parseFloat(getComputedStyle(sections[1]).paddingTop) || 72;
    const r = Math.min(56, sectionY * 0.6); // зона переходу між секціями — у межах їхніх відступів

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.height = `${H}px`;

    // Старт — унизу hero, далі шлях іде вздовж бічного поля й перетинає сторінку на межах секцій
    const first = sections[0];
    let side = 0;
    let d = `M${xs[side]} ${first.offsetTop + first.offsetHeight - r}`;
    const stopPoints = [[xs[side], first.offsetTop + first.offsetHeight - r]];

    sections.slice(0, -1).forEach((section, i) => {
      const b = section.offsetTop + section.offsetHeight;
      const from = xs[side];
      const to = xs[1 - side];
      if (i > 0) d += ` L${from} ${b - r}`;
      d += ` C${from} ${b} ${to} ${b} ${to} ${b + r}`;
      stopPoints.push([(from + to) / 2, b]);
      side = 1 - side;
    });

    const last = sections[sections.length - 1];
    const endY = last.offsetTop + last.offsetHeight - r;
    d += ` L${xs[side]} ${endY}`;
    stopPoints.push([xs[side], endY]);

    track.setAttribute('d', d);
    trail.setAttribute('d', d);
    length = trail.getTotalLength();
    trail.style.strokeDasharray = `${length}`;

    samples = [];
    const step = 24;
    for (let l = 0; l <= length; l += step) samples.push([l, trail.getPointAtLength(l).y]);
    samples.push([length, trail.getPointAtLength(length).y]);

    stopsGroup.replaceChildren();
    stops = stopPoints.map(([x, y], i) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x);
      c.setAttribute('cy', y);
      c.setAttribute('r', i === 0 || i === stopPoints.length - 1 ? 7 : 5);
      stopsGroup.append(c);
      return { el: c, y };
    });

    update();
  };

  const update = () => {
    if (!length) return;
    let drawn = length;
    let target = Infinity;
    if (!reducedMotion.matches) {
      const mainTop = main.getBoundingClientRect().top + window.scrollY;
      target = window.scrollY + window.innerHeight * 0.65 - mainTop;
      // y монотонно зростає вздовж шляху — шукаємо останню точку вище цільової позиції
      let lo = 0;
      let hi = samples.length - 1;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (samples[mid][1] <= target) lo = mid; else hi = mid - 1;
      }
      drawn = samples[lo][1] <= target ? samples[lo][0] : 0;
    }
    trail.style.strokeDashoffset = `${length - drawn}`;
    stops.forEach((s) => s.el.classList.toggle('is-passed', s.y <= target));
  };

  let raf = 0;
  const schedule = (fn) => () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fn);
  };

  build();
  window.addEventListener('scroll', schedule(update), { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(schedule(build)).observe(main);
  else window.addEventListener('resize', schedule(build));
  document.fonts?.ready.then(build);
  reducedMotion.addEventListener?.('change', update);
}

/* ---------- Рік у футері ---------- */

function initYear() {
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
}

/* ---------- Старт ---------- */

initFund();
initLang();
initHeader();
initActiveNav();
initReveal();
initCopy();
initShare();
initQR();
initPrivacyDialog();
initForm();
initJourney();
initYear();
