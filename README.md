# БФ «Наш шлях» — сайт-візитівка

Односторінковий статичний сайт благодійного фонду. Без фреймворків і збирання: відкривається подвійним кліком по `index.html` і деплоїться на будь-який статичний хостинг як є.

```
index.html            розмітка, SEO-теги, JSON-LD, інлайн SVG-іконки
styles.css            стилі (mobile-first, кольори — CSS-змінні в :root)
script.js             мова UA/EN, меню, анімації, копіювання, QR, форма
favicon.svg           логотип / favicon
apple-touch-icon.png  іконка для iOS (180×180)
og-image.png          прев'ю для соцмереж (1200×630)
telegram-worker.js    альтернатива Web3Forms: Cloudflare Worker → Telegram-бот
robots.txt, sitemap.xml
```

Зовнішні залежності: шрифт Manrope (Google Fonts) і бібліотека `qrcode-generator` з cdnjs (з SRI-хешем). Якщо бібліотека не завантажиться, замість QR-коду лишиться SVG-плейсхолдер.

---

## 1. Як замінити плейсхолдери

Усі вигадані дані позначені в коді коментарем `TODO`. Знайти їх усі можна так:

```bash
grep -rn "TODO" --include="*.html" --include="*.js" --include="*.txt" --include="*.xml" .
```

> **Важливо про тексти.** Видимі тексти є у двох місцях: українська версія — в `index.html` (щоб сторінка індексувалася й працювала без JS), а обидві мови — в об'єкті `I18N` на початку `script.js`. Змінюючи текст з атрибутом `data-i18n="ключ"`, оновіть його в HTML **і** в `I18N.uk` / `I18N.en`. Реквізити, телефони, email і посилання не перекладаються, тому їх достатньо змінити лише в HTML.

### Список TODO

| Що | Де |
|---|---|
| **Домен** `nashshliakh.org.ua` | `index.html`: `canonical`, `og:url`, `og:image`, `twitter:image`, JSON-LD; `robots.txt`; `sitemap.xml` |
| **JSON-LD** (ЄДРПОУ `taxID`, email, телефон, адреса, рік заснування, соцмережі) | `index.html`, блок `<script type="application/ld+json">` у `<head>` |
| **Рік заснування і місто** в hero | `index.html` (`hero.eyebrow`) + `script.js` (`hero.eyebrow` uk/en) |
| **Історія фонду** («Про нас») | `index.html` (`about.*`) + `script.js` |
| **Фото команди** | `index.html`, секція `#about`: замініть `<div class="photo-placeholder">` на `<img>` (приклад — у коментарі поруч). Рекомендовано 1200×900, JPG/WebP до 200 КБ |
| **Посилання на банку Monobank** | `index.html`: атрибут `data-qr` у блоці QR-коду. Використовуйте **постійну** банку фонду, а не банку окремого збору, яку згодом закриють |
| **Реквізити в гривні** (отримувач, ЄДРПОУ, IBAN, банк, призначення) | `index.html`, секція `#help`: видимий текст у `.req__value` **і** атрибут `data-copy` (саме його копіює кнопка; IBAN — без пробілів) |
| **PayPal і SWIFT** | `index.html`, блок `<details class="intl">` (так само: текст + `data-copy`) |
| **Telegram-канал зі звітами і папка зі звітами** | `index.html`, секція `#reports` |
| **Адреса складу / умови прийому речей** | `faq.a1` в `index.html` і `script.js` |
| **Контакти**: телефон, email, Telegram, адреса | `index.html`: секція `#contact`, футер; `footer.address` у `script.js` (uk/en) |
| **Соцмережі** (Telegram, Instagram, Facebook) | `index.html`: футер + `sameAs` у JSON-LD |
| **Юридична назва, ЄДРПОУ** | футер в `index.html`, `footer.legalName` у `script.js` |
| **Політика конфіденційності** | `index.html` (`<dialog id="privacy-dialog">`) + `privacy.body` у `script.js`. Узгодьте текст з юристом |
| **Ключ Web3Forms** | `script.js`, константа `WEB3FORMS_ACCESS_KEY` (див. розділ 2) |
| **URL Telegram-воркера** (якщо використовуєте) | `script.js`, константа `TELEGRAM_WORKER_URL` |
| **og-image.png** | Згенеровано автоматично з назвою й гаслом. Можна замінити власним зображенням 1200×630 |
| **Дата в sitemap.xml** | `<lastmod>` після кожного суттєвого оновлення |

Кольори сайту змінюються в одному місці — у змінних на початку `styles.css` (`--navy-800`, `--gold-500` тощо).

---

## 2. Підключення форми (Web3Forms)

[Web3Forms](https://web3forms.com) — безкоштовний сервіс, який пересилає заявки з форми на пошту, без власного бекенду.

1. Відкрийте <https://web3forms.com>, введіть email, на який мають приходити заявки (напр. `info@nashshliakh.org.ua`), і натисніть **Create Access Key**.
2. Ключ прийде листом. Вставте його на початку `script.js`:
   ```js
   const WEB3FORMS_ACCESS_KEY = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
   ```
3. Задеплойте сайт і надішліть тестову заявку.

Поки ключ не вказано, форма працює в **демо-режимі**: нічого не відправляє й показує повідомлення про це.

Як це працює:
- клієнтська валідація з повідомленнями українською або англійською, залежно від обраної мови;
- захист від спаму: приховане поле-пастка `botcheck` (honeypot). Якщо його заповнено, заявка не відправляється, а бот бачить «успіх». Web3Forms також відхиляє заявки з непорожнім `botcheck`;
- якщо в полі «Телефон або email» вказано email, Web3Forms підставить його як Reply-To, і відповідати можна прямо з пошти.

У налаштуваннях Web3Forms можна обмежити домени, з яких приймаються заявки, і додати hCaptcha, якщо спаму стане багато.

### Альтернатива: заявки в Telegram

Файл `telegram-worker.js` — Cloudflare Worker, що пересилає заявку в Telegram-чат через бота. Покрокова інструкція — у коментарі на початку файлу. Коротко:

1. Створіть бота в [@BotFather](https://t.me/BotFather), додайте його в робочу групу й дізнайтеся `chat_id`.
2. Створіть Worker у Cloudflare, вставте код і задайте змінні `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (секрети) та `ALLOWED_ORIGIN` (домен сайту).
3. У `script.js` укажіть `TELEGRAM_WORKER_URL` і змініть `FORM_PROVIDER = 'telegram'`.

Токен бота зберігається лише в Cloudflare. На сайт він не потрапляє.

---

## 3. Деплой на GitHub Pages

1. Створіть репозиторій на GitHub (напр. `nashshliakh-site`) і завантажте в нього всі файли з цієї теки:
   ```bash
   git init
   git add .
   git commit -m "Сайт БФ «Наш шлях»"
   git branch -M main
   git remote add origin https://github.com/<user>/nashshliakh-site.git
   git push -u origin main
   ```
2. У репозиторії відкрийте **Settings → Pages**.
3. У розділі **Build and deployment** оберіть: *Source* — **Deploy from a branch**, *Branch* — **main**, тека **/ (root)**. Натисніть **Save**.
4. За хвилину-дві сайт буде доступний за адресою `https://<user>.github.io/nashshliakh-site/`.

Усі шляхи на сайті відносні, тож він працює і з підкаталогу, і з власного домену.

### Прив'язка власного домену

1. **Settings → Pages → Custom domain**: введіть `nashshliakh.org.ua` і натисніть **Save**. GitHub створить у репозиторії файл `CNAME`.
2. У DNS-панелі реєстратора домену додайте записи:

   | Тип | Ім'я | Значення |
   |---|---|---|
   | `A` | `@` | `185.199.108.153` |
   | `A` | `@` | `185.199.109.153` |
   | `A` | `@` | `185.199.110.153` |
   | `A` | `@` | `185.199.111.153` |
   | `AAAA` | `@` | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` (необов'язково, для IPv6) |
   | `CNAME` | `www` | `<user>.github.io` |

3. Зачекайте, поки оновиться DNS (від кількох хвилин до 24 годин). Перевірити можна командою `dig nashshliakh.org.ua +short`.
4. Коли домен підтвердиться, увімкніть **Enforce HTTPS** у тих самих налаштуваннях Pages.
5. Перевірте, що домен у `canonical`, `og:*`, JSON-LD, `robots.txt` і `sitemap.xml` збігається з реальним.

Рекомендуємо також підтвердити домен в акаунті GitHub (**Settings → Pages → Verified domains**), щоб ніхто інший не зміг прив'язати його до свого репозиторію.

### Інші хостинги

- **Netlify**: <https://app.netlify.com/drop> — перетягніть теку з сайтом у вікно браузера. Або підключіть GitHub-репозиторій без команди збирання, *Publish directory* — `/`.
- **Cloudflare Pages**: *Workers & Pages → Create → Pages → Connect to Git* (або *Upload assets*). *Build command* лишіть порожнім, *Output directory* — `/`.

Власний домен на обох платформах підключається в розділі *Domains* за підказками в інтерфейсі.

---

## 4. Що вже є на сторінці

- **Мова UA/EN**: перемикач у хедері; вибір зберігається в `localStorage`. Перекладаються тексти, `title`, `meta description` і повідомлення форми.
- **Доступність**: семантичні теги, skip-link, видимий фокус, `aria-*` для іконок, меню, прогрес-бару й форми, контраст за WCAG AA. Анімації вимикаються, якщо в системі ввімкнено `prefers-reduced-motion`.
- **Без «живих» даних**: на сторінці немає сум зборів, лічильників і дат, які довелося б оновлювати. Рік у © підставляється автоматично. Актуальні збори та звіти публікуються в Telegram-каналі.
- **«Шлях»**: хвиляста лінія, що з'єднує секції й поступово промальовується під час прокручування (функція `initJourney` у `script.js`).
- **SEO**: title, description, Open Graph, Twitter Card, canonical, favicon, розмітка schema.org `NGO`, `robots.txt`, `sitemap.xml`.
- **Адаптивність**: перевірено на ширині 375 і 1280 px, працює від 360 до 1440 px без горизонтального скролу.
