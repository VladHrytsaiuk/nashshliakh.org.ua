/**
 * Cloudflare Worker: приймає заявки з форми сайту й пересилає їх у Telegram-чат фонду.
 * Альтернатива Web3Forms — токен бота зберігається в секретах воркера, а не в коді сайту.
 *
 * Як задеплоїти:
 *   1. Створіть бота в @BotFather → отримаєте TELEGRAM_BOT_TOKEN.
 *   2. Додайте бота в групу (або канал адміністратором), куди мають приходити заявки.
 *      chat_id групи можна дізнатися, написавши в групу й відкривши
 *      https://api.telegram.org/bot<TOKEN>/getUpdates (поле "chat":{"id":-100...}).
 *   3. dash.cloudflare.com → Workers & Pages → Create → Worker → вставте цей код → Deploy.
 *   4. Settings → Variables and Secrets:
 *        TELEGRAM_BOT_TOKEN  (Secret)  — токен бота
 *        TELEGRAM_CHAT_ID    (Secret)  — id чату, напр. -1001234567890
 *        ALLOWED_ORIGIN      (Text)    — https://nashshliakh.org.ua  (можна кілька через кому)
 *   5. У script.js: TELEGRAM_WORKER_URL = 'https://<назва>.<субдомен>.workers.dev',
 *      FORM_PROVIDER = 'telegram'.
 *
 * Додатково від спаму можна підключити Cloudflare Turnstile або Rate Limiting rules.
 */

const MAX = { name: 80, contact: 120, type: 60, message: 3000 };

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
    const corsOrigin = allowed.includes(origin) ? origin : allowed[0] || '';
    const cors = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors },
      });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
    if (allowed.length && !allowed.includes(origin)) return json({ ok: false, error: 'Forbidden' }, 403);

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400);
    }

    // Honeypot: якщо приховане поле заповнене — це бот. Відповідаємо «ок», але нічого не шлемо.
    if (data.botcheck) return json({ ok: true });

    const field = (key) => String(data[key] ?? '').trim().slice(0, MAX[key]);
    const name = field('name');
    const contact = field('contact');
    const type = field('type') || '—';
    const message = field('message');

    if (name.length < 2 || !contact || message.length < 10) {
      return json({ ok: false, error: 'Validation failed' }, 422);
    }

    const text = [
      '<b>📩 Нове звернення з сайту</b>',
      '',
      `<b>Тип:</b> ${escapeHtml(type)}`,
      `<b>Ім'я:</b> ${escapeHtml(name)}`,
      `<b>Контакт:</b> ${escapeHtml(contact)}`,
      '',
      escapeHtml(message),
    ].join('\n');

    const tg = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!tg.ok) {
      console.error('Telegram API error', tg.status, await tg.text());
      return json({ ok: false, error: 'Delivery failed' }, 502);
    }
    return json({ ok: true });
  },
};

function escapeHtml(str) {
  return str.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
}
