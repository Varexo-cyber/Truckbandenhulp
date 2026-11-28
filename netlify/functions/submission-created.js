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
  const voornaam = esc(String(data.naam || '').trim().split(/\s+/)[0] || '');
  return omhulsel(`
<h1 style="margin:0 0 14px;font-size:22px;color:${MERK.kleur}">Bedankt voor uw bericht${voornaam ? ', ' + voornaam : ''}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#2B3546">We hebben uw bericht goed ontvangen en nemen zo snel mogelijk contact met u op.</p>
<p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#2B3546">${MERK.pechTekst}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 26px"><tr>
  <td style="background:${MERK.knop};border-radius:8px"><a href="tel:${MERK.telefoonLink}" style="display:inline-block;padding:13px 20px;color:#ffffff;font-weight:bold;font-size:15px;text-decoration:none">Bel ${MERK.telefoon}</a></td>
  <td style="width:10px"></td>
  <td style="background:#0B7A3D;border-radius:8px"><a href="${MERK.whatsapp}" style="display:inline-block;padding:13px 20px;color:#ffffff;font-weight:bold;font-size:15px;text-decoration:none">WhatsApp</a></td>
</tr></table>
<p style="margin:0 0 8px;font-size:13px;color:#5A6780">Uw bericht:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #DCE2EC;padding-top:6px">${tabel(data)}</table>
<p style="margin:24px 0 0;font-size:15px;color:#2B3546">Met vriendelijke groet,<br><b>${MERK.naam}</b></p>`);
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

  await post.sendMail({
    from: `"${MERK.naam} website" <${MERK.adres}>`,
    to: MERK.adres,
    replyTo: geldig ? `"${String(data.naam || '').replace(/"/g, '')}" <${klant}>` : undefined,
    subject: `Nieuw bericht van ${data.naam || 'de website'}${onderwerp}`,
    text: `Nieuw bericht via ${MERK.domein}\n\n${tekst(data)}`,
    html: melding(data, formulier),
  });

  if (geldig) {
    await post.sendMail({
      from: `"${MERK.naam}" <${MERK.adres}>`,
      to: klant,
      replyTo: MERK.adres,
      subject: `We hebben uw bericht ontvangen | ${MERK.naam}`,
      text: `Bedankt voor uw bericht. We nemen zo snel mogelijk contact met u op.\n${MERK.pechTekst} Bel ${MERK.telefoon} of WhatsApp ${MERK.whatsapp}\n\nUw bericht:\n${tekst(data)}\n\nMet vriendelijke groet,\n${MERK.naam}\n${MERK.site}`,
      html: bevestiging(data),
    });
  }
  return { statusCode: 200, body: 'Verstuurd' };
};

/* voor het testen van de opmaak zonder te versturen */
exports._sjablonen = { bevestiging, melding, MERK };
