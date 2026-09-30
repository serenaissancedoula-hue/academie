/* Académie Sérénaissance — petit générateur de PDF sans dépendance (texte Helvetica + photo JPEG).
   PdfSimple.creer() -> { titre(t), texte(t, {taille, gras, couleur}), espace(n), trait(), image(octets, largeur, hauteur, w, h), blob() } */
(function () {
  'use strict';
  var WIN = { '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133, '†': 134, '‡': 135, 'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140, 'Ž': 142, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '˜': 152, '™': 153, 'š': 154, '›': 155, 'œ': 156, 'ž': 158, 'Ÿ': 159 };
  function enc(t) {
    var out = '';
    for (var i = 0; i < t.length; i++) {
      var ch = t[i], c = t.charCodeAt(i);
      if (WIN[ch]) c = WIN[ch]; else if (ch === '→') { out += '->'; continue; } else if (c > 255) continue;
      var s = String.fromCharCode(c);
      if (s === '(' || s === ')' || s === '\\') s = '\\' + s;
      out += s;
    }
    return out;
  }
  function hex(c) { var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c || '#2c221e'); return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255].map(function (x) { return x.toFixed(3); }).join(' ') : '0 0 0'; }
  function creer() {
    var L = 612, H = 792, M = 54, pages = [], cur = null, y = 0, images = [];
    function nouvellePage() { cur = []; pages.push(cur); y = H - 60; cur.push('0.659 0.341 0.263 rg 0 ' + (H - 8) + ' ' + L + ' 8 re f'); }
    nouvellePage();
    function largeurMax(taille, marge) { return Math.floor((L - 2 * M - (marge || 0)) / (taille * 0.5)); }
    function couper(t, n) {
      var mots = String(t).split(/\s+/), lignes = [], l = '';
      mots.forEach(function (m) { if ((l + ' ' + m).trim().length > n && l) { lignes.push(l); l = m; } else l = (l ? l + ' ' : '') + m; });
      if (l) lignes.push(l); return lignes.length ? lignes : [''];
    }
    var api = {
      texte: function (t, o) {
        o = o || {}; var taille = o.taille || 10, marge = o.marge || 0;
        couper(t, largeurMax(taille, marge)).forEach(function (ligne) {
          if (y < 60) nouvellePage();
          cur.push('BT /' + (o.gras ? 'F2' : 'F1') + ' ' + taille + ' Tf ' + hex(o.couleur) + ' rg ' + M + ' ' + y.toFixed(1) + ' Td (' + enc(ligne) + ') Tj ET');
          y -= taille * 1.38;
        });
        return api;
      },
      espace: function (n) { y -= n || 8; if (y < 60) nouvellePage(); return api; },
      trait: function () { if (y < 70) nouvellePage(); cur.push('0.659 0.341 0.263 RG 0.8 w ' + M + ' ' + y + ' m ' + (L - M) + ' ' + y + ' l S'); y -= 16; return api; },
      image: function (octets, lp, hp, w, h) {
        if (!octets) return api;
        images.push({ octets: octets, lp: lp, hp: hp }); var nom = 'Im' + images.length;
        if (y - h < 60) nouvellePage();
        cur.push('q ' + w + ' 0 0 ' + h + ' ' + (L - M - w) + ' ' + (y - h + 10) + ' cm /' + nom + ' Do Q');
        return api;
      },
      y: function () { return y; }, setY: function (v) { y = v; return api; },
      blob: function () {
        var parts = [], offsets = [], taille = 0;
        function ajouter(s) { var b = typeof s === 'string' ? new TextEncoder().encode(s.split('').map(function (c) { return c; }).join('')) : s; parts.push(b); taille += b.length; }
        function latin1(s) { var u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; }
        function obj(n, contenu) { offsets[n] = taille; ajouter(latin1(n + ' 0 obj\n')); if (typeof contenu === 'string') ajouter(latin1(contenu)); else contenu.forEach(function (c) { ajouter(typeof c === 'string' ? latin1(c) : c); }); ajouter(latin1('\nendobj\n')); }
        ajouter(latin1('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
        var nPages = pages.length, premierePage = 5 + images.length;
        obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
        var kids = []; for (var i = 0; i < nPages; i++) kids.push((premierePage + i * 2) + ' 0 R');
        obj(2, '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + nPages + ' >>');
        obj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
        obj(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
        var xo = [];
        images.forEach(function (im, k) {
          var n = 5 + k; xo.push('/Im' + (k + 1) + ' ' + n + ' 0 R');
          obj(n, ['<< /Type /XObject /Subtype /Image /Width ' + im.lp + ' /Height ' + im.hp + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.octets.length + ' >>\nstream\n', im.octets, '\nendstream']);
        });
        pages.forEach(function (p, i) {
          var np = premierePage + i * 2, nc = np + 1, flux = latin1(p.join('\n'));
          obj(np, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + L + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << ' + xo.join(' ') + ' >> >> /Contents ' + nc + ' 0 R >>');
          obj(nc, ['<< /Length ' + flux.length + ' >>\nstream\n', flux, '\nendstream']);
        });
        var total = premierePage + nPages * 2, xref = taille, t = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
        for (var j = 1; j < total; j++) t += String(offsets[j]).padStart(10, '0') + ' 00000 n \n';
        t += 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
        ajouter(latin1(t));
        return new Blob(parts, { type: 'application/pdf' });
      }
    };
    return api;
  }
  window.PdfSimple = { creer: creer };
})();
