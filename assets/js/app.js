/* Truckbandenhulp — menu, bandenkiezer, pechmelding via WhatsApp en video's.
   Header, footer en gegevens staan al in de HTML (bron/bouw.py). Vanille JS, geen afhankelijkheden. */
(function () {
  'use strict';
  var C = window.SITE;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var telUrl = 'tel:' + C.telefoonLink;
  function waUrl(t) { return 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(t); }

  var burger = $('.burger');
  if (burger) burger.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) burger.click();
  });

  function melding(t) {
    var el = $('.melding'); if (!el) return;
    el.textContent = t; el.classList.add('on');
    clearTimeout(melding._t); melding._t = setTimeout(function () { el.classList.remove('on'); }, 3500);
  }

  /* Kentekenvelden: hoofdletters, alleen letters, cijfers en streepjes */
  $$('.kenteken input').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var p = inp.selectionStart, v = inp.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10);
      if (v !== inp.value) { inp.value = v; try { inp.setSelectionRange(p, p); } catch (e) {} }
    });
  });

  /* ---------- Locatie ---------- */
  var pos = null;
  function locate(cb) {
    if (!navigator.geolocation) { cb(null, 'Uw browser kan geen locatie bepalen.'); return; }
    navigator.geolocation.getCurrentPosition(function (p) {
      pos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) };
      cb(pos);
    }, function (e) {
      cb(null, e.code === 1 ? 'Geen toestemming voor uw locatie. Typ de plek of hectometerpaal in.' : 'Locatie niet gevonden. Typ de plek in.');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }
  function coords(p) { return p.lat.toFixed(5) + ', ' + p.lng.toFixed(5); }
  function maps(p) { return 'https://maps.google.com/?q=' + p.lat.toFixed(6) + ',' + p.lng.toFixed(6); }

  /* ---------- Bandenkiezer ---------- */
  /* Bovenaanzicht, rijrichting naar rechts: de bovenkant is de bestuurderskant (links). */
  var BW = 64, BH = 30;
  var TYPES = {
    combi: {
      naam: 'Trekker met oplegger',
      teken: function () {
        return '<rect x="600" y="100" width="270" height="100" rx="8" fill="#C7D0DF"/>' +
          '<circle cx="660" cy="150" r="22" fill="#AEB9CC"/>' +
          '<rect x="40" y="82" width="600" height="136" rx="6" fill="#fff" stroke="#9AA8BF" stroke-width="2"/>' +
          '<path d="M60 104h560M60 196h560" stroke="#E3E8F1" stroke-width="2"/>' +
          '<text x="340" y="156" text-anchor="middle" class="rijrichting">OPLEGGER</text>' +
          '<rect x="850" y="80" width="112" height="140" rx="16" fill="#fff" stroke="#0C1A33" stroke-width="2.5"/>' +
          '<path d="M948 92v116" stroke="#9AA8BF" stroke-width="5" stroke-linecap="round"/>' +
          '<text x="895" y="156" text-anchor="middle" class="rijrichting">CABINE</text>';
      },
      eenheden: [
        { naam: 'Trekker', assen: [{ x: 905, label: 'stuuras' }, { x: 720, label: 'aandrijfas', dubbel: true }] },
        { naam: 'Oplegger', assen: [{ x: 330, label: 'as 1' }, { x: 250, label: 'as 2' }, { x: 170, label: 'as 3' }] }
      ]
    },
    bak: {
      naam: 'Bakwagen',
      teken: function () {
        return '<rect x="170" y="100" width="680" height="100" rx="8" fill="#C7D0DF"/>' +
          '<rect x="150" y="82" width="660" height="136" rx="6" fill="#fff" stroke="#9AA8BF" stroke-width="2"/>' +
          '<path d="M170 104h620M170 196h620" stroke="#E3E8F1" stroke-width="2"/>' +
          '<text x="480" y="156" text-anchor="middle" class="rijrichting">LAADBAK</text>' +
          '<rect x="830" y="80" width="120" height="140" rx="16" fill="#fff" stroke="#0C1A33" stroke-width="2.5"/>' +
          '<path d="M936 92v116" stroke="#9AA8BF" stroke-width="5" stroke-linecap="round"/>' +
          '<text x="878" y="156" text-anchor="middle" class="rijrichting">CABINE</text>';
      },
      eenheden: [
        { naam: 'Bakwagen', assen: [{ x: 885, label: 'stuuras' }, { x: 420, label: 'aandrijfas', dubbel: true }, { x: 300, label: 'naloopas' }] }
      ]
    },
    los: {
      naam: 'Losse oplegger of trailer',
      teken: function () {
        return '<rect x="120" y="82" width="720" height="136" rx="6" fill="#fff" stroke="#9AA8BF" stroke-width="2"/>' +
          '<path d="M140 104h680M140 196h680" stroke="#E3E8F1" stroke-width="2"/>' +
          '<circle cx="790" cy="150" r="9" fill="#9AA8BF"/>' +
          '<text x="560" y="156" text-anchor="middle" class="rijrichting">OPLEGGER / TRAILER</text>';
      },
      eenheden: [
        { naam: 'Oplegger', assen: [{ x: 420, label: 'as 1' }, { x: 340, label: 'as 2' }, { x: 260, label: 'as 3' }] }
      ]
    }
  };
  function bandSvg(x, y, id, label) {
    var p = '';
    for (var i = 9; i < BW; i += 10) p += 'M' + (x + i) + ' ' + (y + 5) + 'v' + (BH - 10);
    return '<g class="band" tabindex="0" role="button" aria-pressed="false" data-id="' + id + '" data-label="' + label + '">' +
      '<title>' + label + '</title><rect x="' + x + '" y="' + y + '" width="' + BW + '" height="' + BH + '" rx="6"/><path d="' + p + '"/></g>';
  }
  function tekenType(key) {
    var t = TYPES[key], s = t.teken();
    t.eenheden.forEach(function (u) {
      u.assen.forEach(function (a) {
        var x = a.x - BW / 2, basis = u.naam + ', ' + a.label + ', ';
        if (a.dubbel) {
          s += bandSvg(x, 14, u.naam + a.label + 'Lb', basis + 'links buiten') + bandSvg(x, 47, u.naam + a.label + 'Li', basis + 'links binnen');
          s += bandSvg(x, 223, u.naam + a.label + 'Ri', basis + 'rechts binnen') + bandSvg(x, 256, u.naam + a.label + 'Rb', basis + 'rechts buiten');
        } else {
          s += bandSvg(x, 46, u.naam + a.label + 'L', basis + 'links') + bandSvg(x, 224, u.naam + a.label + 'R', basis + 'rechts');
        }
      });
    });
    s += '<text x="990" y="-6" text-anchor="end" class="rijrichting">RIJRICHTING →</text>' +
      '<text x="10" y="-6" class="rijrichting">LINKS · BESTUURDERSKANT</text>' +
      '<text x="10" y="312" class="rijrichting">RECHTS · BIJRIJDERSKANT</text>';
    return s;
  }

  $$('[data-asmelder]').forEach(function (root) {
    var svg = $('.tekening svg', root), lijst = $('.gekozen', root), bubble = $('[data-bericht]', root);
    var send = $('[data-verstuur]', root), type = 'combi', gekozen = [];

    function zetType(k) {
      type = k; gekozen = [];
      svg.innerHTML = tekenType(k);
      $$('.schakel button', root).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.type === k); });
      update();
    }
    function toggle(g) {
      var id = g.dataset.id, i = gekozen.findIndex(function (b) { return b.id === id; });
      if (i >= 0) gekozen.splice(i, 1); else gekozen.push({ id: id, label: g.dataset.label });
      update();
    }
    svg.addEventListener('click', function (e) { var g = e.target.closest('.band'); if (g) toggle(g); });
    svg.addEventListener('keydown', function (e) {
      var g = e.target.closest('.band');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(g); }
    });
    $$('.schakel button', root).forEach(function (b) { b.addEventListener('click', function () { zetType(b.dataset.type); }); });
    lijst.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-weg]'); if (!b) return;
      gekozen = gekozen.filter(function (x) { return x.id !== b.dataset.weg; }); update();
    });

    var val = function (n) { var el = $('[name=' + n + ']', root); if (!el) return ''; if (el.type === 'radio') { var c = $('[name=' + n + ']:checked', root); return c ? c.value : ''; } return el.value.trim(); };
    function tekst() {
      var r = ['Bandenpech melden via de website', ''];
      if (val('kenteken')) r.push('Kenteken: ' + val('kenteken'));
      r.push('Voertuig: ' + TYPES[type].naam);
      if (gekozen.length) { r.push('Band' + (gekozen.length > 1 ? 'en' : '') + ':'); gekozen.forEach(function (b) { r.push('- ' + b.label); }); }
      if (val('bandmaat')) r.push('Bandmaat: ' + val('bandmaat'));
      if (val('situatie')) r.push('Situatie: ' + val('situatie'));
      var loc = pos ? maps(pos) : val('locatie');
      if (loc) r.push('Locatie: ' + loc);
      ['bedrijf', 'naam', 'telefoon'].forEach(function (n) { if (val(n)) r.push(n.charAt(0).toUpperCase() + n.slice(1) + ': ' + val(n)); });
      if (val('toelichting')) r.push('', 'Toelichting: ' + val('toelichting'));
      r.push('', 'Foto\'s stuur ik hierna.');
      return r.join('\n');
    }
    function update() {
      $$('.band', svg).forEach(function (g) {
        var on = gekozen.some(function (b) { return b.id === g.dataset.id; });
        g.classList.toggle('aan', on); g.setAttribute('aria-pressed', on);
      });
      lijst.innerHTML = gekozen.length ? gekozen.map(function (b) {
        return '<li>' + b.label + '<button type="button" data-weg="' + b.id + '" aria-label="' + b.label + ' verwijderen">' + icon('x') + '</button></li>';
      }).join('') : '<li class="leeg">Tik op de band in de tekening</li>';
      var t = tekst();
      if (bubble) bubble.textContent = t;
      if (send) send.href = waUrl(t);
    }
    root.addEventListener('input', update);
    root.addEventListener('change', update);
    var lk = $('[data-locatie]', root);
    if (lk) lk.addEventListener('click', function () {
      var t = $('.t', lk); t.textContent = 'Zoeken…';
      locate(function (p, err) {
        t.textContent = p ? 'Gevonden' : 'Mijn locatie';
        var inp = $('[name=locatie]', root);
        if (p) { inp.value = coords(p) + ' (GPS, ±' + p.acc + ' m)'; } else melding(err);
        update();
      });
    });

    /* Kenteken uit de URL of uit de hero overnemen */
    var k = new URLSearchParams(location.search).get('kenteken');
    if (k && $('[name=kenteken]', root)) $('[name=kenteken]', root).value = k.toUpperCase().slice(0, 10);

    if (send) send.addEventListener('click', function (e) {
      var tel = $('[name=telefoon]', root);
      if (tel && !/^(\+?\d[\d\s-]{8,})$/.test(tel.value.trim())) {
        e.preventDefault(); tel.closest('.veld').classList.add('fout'); tel.focus();
        melding('Vul een telefoonnummer in waarop we u kunnen bereiken.');
      }
    });
    var tel = $('[name=telefoon]', root);
    if (tel) tel.addEventListener('input', function () { tel.closest('.veld').classList.remove('fout'); });

    /* Foto's */
    var file = $('input[type=file]', root), thumbs = $('.thumbs', root);
    if (file) file.addEventListener('change', function () {
      thumbs.innerHTML = '';
      Array.prototype.slice.call(file.files, 0, 6).forEach(function (f) {
        if (!/^image\//.test(f.type)) return;
        var img = document.createElement('img'); img.alt = ''; img.src = URL.createObjectURL(f); thumbs.appendChild(img);
      });
    });

    zetType('combi');
  });

  /* Hero: kenteken invullen en door naar de bandenkiezer */
  $$('[data-snelmelder]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      var k = $('input', f).value.trim(), doel = $('[data-asmelder] [name=kenteken]');
      if (doel) {
        e.preventDefault();
        doel.value = k; doel.dispatchEvent(new Event('input', { bubbles: true }));
        $('#melden').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* ---------- FAQ: één tegelijk open ---------- */
  $$('.faq').forEach(function (f) {
    $$('details', f).forEach(function (d) {
      d.addEventListener('toggle', function () { if (d.open) $$('details', f).forEach(function (o) { if (o !== d) o.open = false; }); });
    });
  });

  /* ---------- Video's: MP4 of WebM, alleen afspelen in beeld ---------- */
  var stil = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var probe = document.createElement('video');
  var webm = !probe.canPlayType('video/mp4; codecs="avc1.640028"') && !!probe.canPlayType('video/webm; codecs="vp9"');
  var vids = $$('video[data-src]');
  vids.forEach(function (v) { v.muted = true; v.playsInline = true; v.loop = true; if (webm) v.dataset.src = v.dataset.src.replace(/\.mp4$/, '.webm'); });
  /* Video's starten pas als de pagina helemaal geladen is, zodat ze het laden niet vertragen.
     Op telefoons en bij databesparing blijft het stilstaande beeld staan: scheelt data onderweg. */
  var zuinig = (navigator.connection && navigator.connection.saveData) || window.matchMedia('(max-width: 640px)').matches;
  function startVideos() {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { if (!v.getAttribute('src')) v.src = v.dataset.src; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: .1 });
    vids.forEach(function (v) { vo.observe(v); });
  }
  if (!stil && !zuinig && 'IntersectionObserver' in window && vids.length) {
    var start = function () { setTimeout(startVideos, 900); };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
  }
})();
