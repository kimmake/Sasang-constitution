/* 결과를 PNG 이미지로 그려 저장합니다. 모든 처리는 브라우저 안에서 이루어집니다. */
(function () {
  var S = window.SURVEY;
  var FONT = '"Pretendard","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  var C = { bg: '#f6f1e4', card: '#fffdf7', green: '#1f4d3a', soft: '#e3ece3', line: '#d9d0b8', text: '#1d2a22', muted: '#55635a', tan: '#f0e8d2' };
  var W = 1080, PAD = 56, INNER = W - PAD * 2;

  function wrap(ctx, text, maxW) {
    var lines = [], cur = '';
    text.split(' ').forEach(function (word) {
      var test = cur ? cur + ' ' + word : word;
      if (ctx.measureText(test).width <= maxW) { cur = test; return; }
      if (cur) lines.push(cur);
      if (ctx.measureText(word).width <= maxW) { cur = word; return; }
      cur = '';
      word.split('').forEach(function (ch) {
        if (ctx.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; } else cur += ch;
      });
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // dry=true 이면 높이만 계산
  function paint(ctx, m, dry) {
    var y = 0;
    function font(w, s) { ctx.font = w + ' ' + s + 'px ' + FONT; }
    function para(text, x, maxW, size, weight, color, lh) {
      font(weight, size); ctx.fillStyle = color; ctx.textBaseline = 'top';
      var ls = wrap(ctx, text, maxW);
      ls.forEach(function (l, i) { if (!dry) ctx.fillText(l, x, y + i * lh); });
      y += ls.length * lh;
      return ls.length;
    }
    function measure(text, maxW, size, weight, lh) { font(weight, size); return wrap(ctx, text, maxW).length * lh; }

    if (!dry) { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, 99999); }

    // 머리말
    y = 64;
    font('700', 28);
    var pillW = ctx.measureText('참고용 설문 결과').width + 44;
    if (!dry) { rr(ctx, PAD, y, pillW, 52, 26); ctx.fillStyle = C.green; ctx.fill(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText('참고용 설문 결과', PAD + 22, y + 27); }
    y += 52 + 26;
    para('나의 사상체질 관련 특성', PAD, INNER, 58, '800', C.green, 76);
    y += 8;
    para('체질을 확정하지 않고, 응답에서 확인된 행동·생활 특성을 정리했어요.', PAD, INNER, 30, '500', C.muted, 44);
    y += 24;

    // 응답 현황
    var summary = '본 문항 ' + m.total + '개 중 ' + m.answered + '개에 응답했어요. 미응답·‘잘 모르겠음’은 계산에서 제외했어요.';
    var sh = measure(summary, INNER - 208, 28, '500', 42) + 56;
    if (!dry) {
      rr(ctx, PAD, y, INNER, sh, 28); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
      var cx = PAD + 28 + 70, cy = y + sh / 2;
      ctx.lineWidth = 14; ctx.strokeStyle = C.soft; ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = C.green; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, 52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (m.answered / m.total)); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = C.green; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; font('800', 32); ctx.fillText(m.answered + '/' + m.total, cx, cy); ctx.textAlign = 'left';
    }
    var sy = y; y += 28;
    var saveX = PAD + 200;
    para(summary, saveX, INNER - 200 - 8, 28, '500', C.text, 42);
    y = sy + sh + 24;

    if (m.recentChange) {
      var rh = measure('안내  ' + m.recentChange, INNER - 56, 28, '600', 42) + 44;
      if (!dry) { rr(ctx, PAD, y, INNER, rh, 24); ctx.fillStyle = C.tan; ctx.fill(); }
      var ry = y; y += 22;
      para('안내  ' + m.recentChange, PAD + 28, INNER - 56, 28, '600', C.green, 42);
      y = ry + rh + 24;
    }

    if (m.holdAll) {
      para(S.holdText.overall, PAD, INNER, 32, '500', C.text, 48);
      y += 20;
    } else {
      m.domains.forEach(function (d) {
        // 영역 카드: 높이 계산
        var h = 40 + 52 + 22, items = [];
        if (d.held || !d.lines.length) {
          h += measure(d.held ? S.holdText.domain : S.holdText.trait, INNER - 64, 30, '500', 46);
        } else {
          d.lines.forEach(function (l) {
            var th = measure(l.text, INNER - 64 - 44, 30, '500', 46) + 36;
            items.push(th); h += th + 14;
          });
        }
        h += 28;
        if (!dry) { rr(ctx, PAD, y, INNER, h, 28); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke(); }
        var top = y; y += 36;
        font('700', 28);
        var label = d.id + ' · ' + d.title;
        var lw = ctx.measureText(label).width + 40;
        if (!dry) {
          rr(ctx, PAD + 32, y, lw, 52, 26); ctx.fillStyle = C.soft; ctx.fill();
          ctx.fillStyle = C.green; ctx.textBaseline = 'middle'; ctx.fillText(label, PAD + 52, y + 27);
          font('500', 26); ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.fillText('응답 ' + d.answered + '/' + d.total, PAD + INNER - 32, y + 27); ctx.textAlign = 'left';
        }
        y += 52 + 22;
        if (d.held || !d.lines.length) {
          para(d.held ? S.holdText.domain : S.holdText.trait, PAD + 32, INNER - 64, 30, '500', C.muted, 46);
        } else {
          d.lines.forEach(function (l, i) {
            var th = items[i];
            if (!dry) {
              rr(ctx, PAD + 32, y, INNER - 64, th, 20); ctx.fillStyle = l.kind === 'mixed' ? C.tan : C.soft; ctx.fill();
              ctx.fillStyle = l.kind === 'mixed' ? '#b29b5a' : C.green; ctx.fillRect(PAD + 32, y + 14, 8, th - 28);
            }
            var by = y; y += 18;
            para(l.text, PAD + 32 + 28, INNER - 64 - 44, 30, '500', C.text, 46);
            y = by + th + 14;
          });
        }
        y = top + h + 24;
      });
    }

    // 유의 문구 + 참고문헌
    para('이 결과는 응답을 정리한 것이며, 좋고 나쁨이나 건강 여부를 나타내지 않습니다. 체질 판정이나 의료적 진단을 대신하지 않아요.', PAD, INNER, 27, '600', C.green, 42);
    y += 20;
    if (!dry) { ctx.fillStyle = C.line; ctx.fillRect(PAD, y, INNER, 2); }
    y += 24;
    para('참고문헌', PAD, INNER, 26, '700', C.text, 38);
    para(S.reference.citation, PAD, INNER, 24, '400', C.muted, 36);
    para(S.reference.url, PAD, INNER, 24, '400', C.muted, 36);
    y += 10;
    para(S.reference.disclaimer, PAD, INNER, 24, '400', C.muted, 36);
    y += 56;
    return y;
  }

  function render(m) {
    var probe = document.createElement('canvas').getContext('2d');
    var h = Math.ceil(paint(probe, m, true));
    var cv = document.createElement('canvas');
    var ratio = 1.5; // 선명도
    cv.width = W * ratio; cv.height = h * ratio;
    var ctx = cv.getContext('2d');
    ctx.scale(ratio, ratio);
    paint(ctx, m, false);
    return cv;
  }

  var overlay, img, saveBtn, helpEl, blobRef = null, urlRef = null;
  function close() {
    overlay.hidden = true; document.body.classList.remove('modal-open');
    if (urlRef) { URL.revokeObjectURL(urlRef); urlRef = null; }
    blobRef = null;
  }

  function open(model) {
    overlay = overlay || document.getElementById('overlay');
    img = img || document.getElementById('preview-img');
    saveBtn = saveBtn || document.getElementById('img-save');
    helpEl = helpEl || document.getElementById('overlay-help');
    var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    ready.then(function () {
      var cv = render(model);
      cv.toBlob(function (blob) {
        if (!blob) { alert('이미지를 만들지 못했어요. 다른 브라우저로 시도해 주세요.'); return; }
        blobRef = blob;
        if (urlRef) URL.revokeObjectURL(urlRef);
        urlRef = URL.createObjectURL(blob);
        img.src = urlRef;
        helpEl.textContent = '‘이미지 저장’을 누르세요. 저장이 되지 않으면 아래 이미지를 길게 눌러 저장할 수 있어요.';
        overlay.hidden = false; document.body.classList.add('modal-open');
        saveBtn.focus();
      }, 'image/png');
    });
  }

  function save() {
    if (!blobRef) return;
    var file;
    try { file = new File([blobRef], 'sasang-result.png', { type: 'image/png' }); } catch (e) { file = null; }
    if (file && navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      navigator.share({ files: [file], title: '나의 사상체질 관련 특성' }).catch(function () {});
      return;
    }
    var a = document.createElement('a');
    a.href = urlRef; a.download = '사상체질-관련-특성-결과.png';
    document.body.appendChild(a); a.click(); a.remove();
  }

  document.addEventListener('click', function (e) {
    if (e.target.id === 'img-save') save();
    else if (e.target.id === 'img-close' || e.target.id === 'overlay') close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay && !overlay.hidden) close(); });

  window.SurveyImage = { open: open, _render: render };
})();
