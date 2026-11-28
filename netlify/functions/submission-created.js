/* Truckbandenhulp — verstuurt bij elk ingevuld contactformulier twee e-mails:
   1. een melding naar info@truckbandenhulp.nl (antwoorden gaat direct naar de klant)
   2. een bevestiging naar de klant

   Netlify roept deze functie automatisch aan bij elke formulierinzending die
   door het spamfilter komt. Nodig in Netlify (Environment variables):
     SMTP_GEBRUIKER   het Zoho-mailadres waarmee wordt ingelogd (info@truckbandenhulp.nl)
     SMTP_WACHTWOORD  een app-wachtwoord van Zoho
*/
const nodemailer = require('nodemailer');

const MERK = {
  naam: 'Truckbandenhulp',
  adres: 'info@truckbandenhulp.nl',
  site: 'https://truckbandenhulp.nl',
  domein: 'truckbandenhulp.nl',
  telefoon: '085 744 4166',
  telefoonLink: '+31857444166',
  whatsapp: 'https://wa.me/31857444166',
  kleur: '#0C1A33',
  accent: '#FFC417',
  knop: '#1D4ED8',
  tagline: 'Mobiele bandenservice voor vrachtwagens en trailers',
  pechTekst: 'Staat u nu stil met bandenpech? Bel of app ons direct, dat is sneller dan e-mail.',
  kopExtra: '315/80 R22.5',
  logoB: 300,
  logoH: 21,
  lijn: '#FFC417',
  pechZin: 'Staat u op dit moment stil met bandenpech?',
  achter: '#F3F5F9',
};

const VELDEN = [['naam', 'Naam'], ['bedrijf', 'Bedrijf'], ['email', 'E-mail'], ['telefoon', 'Telefoon'], ['bandenmaat', 'Bandenmaat'], ['onderwerp', 'Onderwerp'], ['bericht', 'Bericht']];

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const regels = (s) => esc(s).replace(/\r?\n/g, '<br>');

function tabel(data) {
  return VELDEN.filter(([k]) => data[k]).map(([k, label]) =>
    `<tr><td style="padding:8px 14px 8px 0;color:#5A6780;font-size:14px;vertical-align:top;white-space:nowrap">${label}</td>` +
    `<td style="padding:8px 0;color:#0C1A33;font-size:15px;vertical-align:top">${regels(data[k])}</td></tr>`).join('');
}

function omhulsel(inhoud) {
  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${MERK.achter};font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${MERK.achter};padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:${MERK.kleur};padding:24px 30px">
  <span style="font-family:Arial Black,Arial,Helvetica,sans-serif;font-weight:900;font-size:20px;letter-spacing:1px;color:#ffffff;text-transform:uppercase">${MERK.naam}</span>
  <span style="font-size:12px;color:${MERK.accent};padding-left:10px;border-left:1px solid ${MERK.accent};margin-left:10px">${MERK.kopExtra}</span>
</td></tr>
<tr><td style="padding:30px">${inhoud}</td></tr>
<tr><td style="background:${MERK.achter};padding:20px 30px;font-size:12px;line-height:1.6;color:#5A6780">
  ${MERK.naam} · ${MERK.tagline}<br>
  <a href="tel:${MERK.telefoonLink}" style="color:#5A6780">${MERK.telefoon}</a> · <a href="mailto:${MERK.adres}" style="color:#5A6780">${MERK.adres}</a> · <a href="${MERK.site}" style="color:#5A6780">${MERK.domein}</a><br>
  ${MERK.naam} is een handelsnaam van D&amp;D Mobiliteit B.V. · Kraijenhoffstraat 137 A, 1018 RG Amsterdam · KvK 98721607
</td></tr></table></td></tr></table></body></html>`;
}

function bevestiging(data) {
  const naam = String(data.naam || '').trim();
  const aanhef = naam ? `Beste ${esc(naam)},` : 'Beste klant,';
  const onderwerp = data.onderwerp ? `<div style="font-size:13px;color:#8A94A6;margin:0 0 6px">${esc(data.onderwerp)}</div>` : '';
  const p = (t) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1F2733">${t}</p>`;
  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td style="padding:32px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Arial,Helvetica,sans-serif">
<tr><td style="padding:0 0 28px">
  <a href="${MERK.site}" style="text-decoration:none"><img src="${MERK.site}/assets/img/handtekening-logo.png" width="${MERK.logoB}" height="${MERK.logoH}" alt="${MERK.naam}" style="display:block;border:0;width:${MERK.logoB}px;height:${MERK.logoH}px"></a>
</td></tr>
<tr><td>
  ${p(aanhef)}
  ${p('Bedankt voor uw bericht. Het is goed bij ons binnengekomen en we nemen zo snel mogelijk contact met u op.')}
  ${p(`${MERK.pechZin} Bel ons dan op <a href="tel:${MERK.telefoonLink}" style="color:#1F2733;font-weight:bold">${MERK.telefoon}</a> of stuur een <a href="${MERK.whatsapp}" style="color:#1F2733;font-weight:bold">WhatsApp</a>, dan helpen we u sneller.`)}
  <p style="margin:24px 0 4px;font-size:15px;line-height:1.65;color:#1F2733">Met vriendelijke groet,</p>
  <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#1F2733"><b>${MERK.naam}</b></p>
</td></tr>
<tr><td style="padding:0 0 28px">
  <div style="font-size:13px;color:#8A94A6;margin:0 0 10px">Uw bericht</div>
  <div style="border-left:3px solid ${MERK.lijn};padding:2px 0 2px 16px">
    ${onderwerp}
    <div style="font-size:14px;line-height:1.6;color:#4A5568">${regels(data.bericht || '')}</div>
  </div>
</td></tr>
<tr><td style="border-top:1px solid #E6E9EF;padding:18px 0 0;font-size:12px;line-height:1.7;color:#8A94A6">
  <a href="tel:${MERK.telefoonLink}" style="color:#5A6780;text-decoration:none">${MERK.telefoon}</a> &nbsp;·&nbsp; <a href="mailto:${MERK.adres}" style="color:#5A6780;text-decoration:none">${MERK.adres}</a> &nbsp;·&nbsp; <a href="${MERK.site}" style="color:#5A6780;text-decoration:none">${MERK.domein}</a><br>
  ${MERK.naam} is een handelsnaam van D&amp;D Mobiliteit B.V., Kraijenhoffstraat 137 A, 1018 RG Amsterdam, KvK 98721607
</td></tr>
</table></td></tr></table></body></html>`;
}

function melding(data, formulier) {
  return omhulsel(`
<h1 style="margin:0 0 6px;font-size:20px;color:${MERK.kleur}">Nieuw bericht via ${MERK.domein}</h1>
<p style="margin:0 0 18px;font-size:14px;color:#5A6780">Formulier: ${esc(formulier)} · Klik op "Beantwoorden" om de klant direct te mailen.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">${tabel(data)}</table>`);
}

function tekst(data) {
  return VELDEN.filter(([k]) => data[k]).map(([k, label]) => `${label}: ${data[k]}`).join('\n');
}

exports.handler = async (event) => {
  let payload;
  try { payload = JSON.parse(event.body).payload; } catch (e) { return { statusCode: 400, body: 'Ongeldige inzending' }; }
  const data = payload.data || {};
  const formulier = payload.form_name || 'contact';
  if (formulier !== 'contact') return { statusCode: 200, body: 'Geen contactformulier' };

  const gebruiker = process.env.SMTP_GEBRUIKER;
  const wachtwoord = process.env.SMTP_WACHTWOORD;
  if (!gebruiker || !wachtwoord) {
    console.error('SMTP_GEBRUIKER of SMTP_WACHTWOORD ontbreekt in de Netlify-instellingen');
    return { statusCode: 500, body: 'E-mail niet ingesteld' };
  }
  const post = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.zoho.eu', port: 465, secure: true, auth: { user: gebruiker, pass: wachtwoord } });
  const klant = String(data.email || '').trim();
  const geldig = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(klant);
  const onderwerp = data.onderwerp ? ` · ${data.onderwerp}` : '';

  /* lukt versturen vanaf het merkadres niet (Zoho weigert de afzender), dan
     gaat de mail via het inlogadres met het merkadres als antwoordadres, en
     komt de foutmelding van Zoho in de inbox terecht */
  const fouten = [];
  async function verstuur(mail) {
    try { await post.sendMail(mail); }
    catch (e) {
      console.error('Versturen vanaf ' + MERK.adres + ' mislukt:', e && e.message);
      fouten.push(String(e && (e.response || e.message) || e));
      if (gebruiker.toLowerCase() === MERK.adres.toLowerCase()) throw e;
      await post.sendMail({ ...mail, from: mail.from.replace('<' + MERK.adres + '>', '<' + gebruiker + '>'), replyTo: mail.replyTo || MERK.adres });
    }
  }

  await verstuur({
    from: `"${MERK.naam} website" <${MERK.adres}>`,
    to: MERK.adres,
    replyTo: geldig ? `"${String(data.naam || '').replace(/"/g, '')}" <${klant}>` : undefined,
    subject: `Nieuw bericht van ${data.naam || 'de website'}${onderwerp}`,
    text: `Nieuw bericht via ${MERK.domein}\n\n${tekst(data)}`,
    html: melding(data, formulier),
  });

  if (geldig) {
    await verstuur({
      from: `"${MERK.naam}" <${MERK.adres}>`,
      to: klant,
      replyTo: MERK.adres,
      subject: `Uw bericht aan ${MERK.naam}`,
      text: `${data.naam ? 'Beste ' + data.naam + ',' : 'Beste klant,'}\n\nBedankt voor uw bericht. Het is goed bij ons binnengekomen en we nemen zo snel mogelijk contact met u op.\n\n${MERK.pechZin} Bel ons dan op ${MERK.telefoon} of stuur een WhatsApp (${MERK.whatsapp}), dan helpen we u sneller.\n\nMet vriendelijke groet,\n${MERK.naam}\n\n---\nUw bericht:\n${data.bericht || ''}\n\n${MERK.telefoon} · ${MERK.adres} · ${MERK.domein}`,
      html: bevestiging(data),
    });
  }
  if (fouten.length) {
    await post.sendMail({
      from: gebruiker, to: gebruiker,
      subject: `Let op: ${MERK.naam} kon niet versturen vanaf ${MERK.adres}`,
      text: `De mails zijn wel verstuurd, maar via ${gebruiker}. Zoho gaf deze melding:\n\n${fouten.join('\n\n')}`,
    }).catch(() => {});
  }
  return { statusCode: 200, body: 'Verstuurd' };
};

/* voor het testen van de opmaak zonder te versturen */
exports._sjablonen = { bevestiging, melding, MERK };
