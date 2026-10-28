/* 결과를 PNG 이미지로 그려 저장합니다. 모든 처리는 브라우저 안에서 이루어집니다. */
(function () {
  var S = window.SURVEY;
  var FONT = '"Pretendard","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  var C = { bg: '#ffffff', card: '#f3f5f4', green: '#25985f', ring: '#2fb36d', soft: '#eef1ef', line: '#d9ddda', text: '#222926', muted: '#5c6560', tan: '#f6f1df' };
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

  var figs = null;

  // dry=true 이면 높이만 계산
  // 영역별 짧은 표현을 한 문장으로 묶어 이미지를 간결하게 만듭니다
  function condense(m) {
    var c = Object.assign({}, m);
    c.domains = m.domains.map(function (d) {
      var d2 = Object.assign({}, d);
      d2.lines = d.held || !d.lines.length ? [] : [{ text: d.lines.map(function (l) { return l.short || l.text; }).join('  ·  '), kind: 'single' }];
      return d2;
    });
    return c;
  }

  function paint(ctx, m, dry) {
    m = condense(m);
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
    var pillW = ctx.measureText('설문 결과').width + 44;
    if (!dry) { rr(ctx, PAD, y, pillW, 52, 26); ctx.fillStyle = C.green; ctx.fill(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText('설문 결과', PAD + 22, y + 27); }
    y += 52 + 26;
    para('나의 사상체질 관련 특성', PAD, INNER, 58, '800', C.green, 76);
    y += 8;
    para('응답에서 확인된 유형과 행동·생활 특성을 정리했어요.', PAD, INNER, 30, '500', C.muted, 44);
    y += 24;

    // 응답 현황
    var summary = m.answered === m.total ? '본 문항 ' + m.total + '개에 모두 응답했어요.' : '본 문항 ' + m.total + '개 중 ' + m.answered + '개에 응답했어요. 미응답은 계산에서 제외했어요.';
    var sh = measure(summary, INNER - 208, 28, '500', 42) + 56;
    if (!dry) {
      rr(ctx, PAD, y, INNER, sh, 16); ctx.fillStyle = C.card; ctx.fill();
      var cx = PAD + 28 + 70, cy = y + sh / 2;
      ctx.lineWidth = 14; ctx.strokeStyle = C.soft; ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = C.ring; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, 52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (m.answered / m.total)); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = C.green; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; font('800', 32); ctx.fillText(m.answered + '/' + m.total, cx, cy); ctx.textAlign = 'left';
    }
    var sy = y; y += 28;
    var saveX = PAD + 200;
    para(summary, saveX, INNER - 200 - 8, 28, '500', C.text, 42);
    y = sy + sh + 24;

    // 내 유형 카드: 인물 그림 + 유형명 + 체형/성격 표 (확률·정확도 수치 없음)
    if (m.ks) {
      var tc = m.typeCard;
      if (m.ks.tie || !tc) {
        var kt = S.typeResult.tie;
        var th0 = measure(kt, INNER - 56, 30, '600', 46) + 40;
        if (!dry) { rr(ctx, PAD, y, INNER, th0, 20); ctx.fillStyle = C.card; ctx.fill(); }
        var t0 = y; y += 20;
        para(kt, PAD + 28, INNER - 56, 30, '600', C.text, 46);
        y = t0 + th0 + 24;
      } else {
        var INK = '#2b2b2b', FIGW = 200, FIGH = 380, lblW = 100, cx0 = PAD + 28 + FIGW + 16, cw = INNER - 56 - (FIGW + 16) * 2, tw = cw - lblW - 28;
        font('800', 30); ctx.fillStyle = C.green; ctx.textBaseline = 'top';
        if (!dry) ctx.fillText(S.typeResult.title, PAD, y);
        y += 52;
        var bH = measure(tc.build, tw, 25, '600', 37) + 32, cH = measure(tc.character, tw, 25, '600', 37) + 32;
        var centerH = 92 + bH + cH, inner = Math.max(FIGH, centerH);
        var cardH = 28 + 52 + inner + 28;
        if (!dry) {
          rr(ctx, PAD, y, INNER, cardH, 28); ctx.fillStyle = '#d6efe3'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
          font('900', 34); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('- 사상체질 -', W / 2, y + 22); ctx.textAlign = 'left';
        }
        var iy = y + 28 + 52;
        if (!dry && figs) {
          ctx.drawImage(figs.F, PAD + 28, iy + (inner - FIGH) / 2, FIGW, FIGH);
          ctx.drawImage(figs.M, W - PAD - 28 - FIGW, iy + (inner - FIGH) / 2, FIGW, FIGH);
        }
        var ty = iy + (inner - centerH) / 2;
        if (!dry) { font('900', 62); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(tc.name, cx0 + cw / 2, ty); ctx.textAlign = 'left'; }
        var ry = ty + 92;
        [['체형', tc.build, bH], ['성격', tc.character, cH]].forEach(function (row) {
          if (!dry) {
            ctx.fillStyle = '#fff'; ctx.fillRect(cx0, ry, cw, row[2]); ctx.fillStyle = '#cdeedd'; ctx.fillRect(cx0, ry, lblW, row[2]);
            ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(cx0, ry, cw, row[2]); ctx.strokeRect(cx0, ry, lblW, row[2]);
            font('900', 28); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(row[0], cx0 + lblW / 2, ry + row[2] / 2); ctx.textAlign = 'left';
          }
          var sy0 = y; y = ry + 16;
          para(row[1], cx0 + lblW + 14, tw, 25, '600', '#222', 37);
          y = sy0; ry += row[2];
        });
        y = y + cardH + 24;
      }
    }

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
        if (!dry) { ctx.fillStyle = C.line; ctx.fillRect(PAD, y, INNER, 2); }
        var top = y; y += 36;
        font('700', 28);
        var label = d.id + ' · ' + d.title;
        var lw = ctx.measureText(label).width + 40;
        if (!dry) {
          rr(ctx, PAD + 32, y, lw, 52, 26); ctx.fillStyle = C.soft; ctx.fill();
          ctx.fillStyle = C.green; ctx.textBaseline = 'middle'; ctx.fillText(label, PAD + 52, y + 27);
          var rx = PAD + INNER - 32 - 34, ry = y + 26;
          ctx.lineWidth = 9; ctx.strokeStyle = C.soft; ctx.beginPath(); ctx.arc(rx, ry, 26, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = C.ring; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(rx, ry, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (d.answered / d.total)); ctx.stroke(); ctx.lineCap = 'butt';
          font('800', 19); ctx.fillStyle = C.green; ctx.textAlign = 'center'; ctx.fillText(d.answered + '/' + d.total, rx, ry + 1); ctx.textAlign = 'left';
          font('500', 24); ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.fillText('응답', rx - 44, y + 27); ctx.textAlign = 'left';
        }
        y += 52 + 22;
        if (d.held || !d.lines.length) {
          para(d.held ? S.holdText.domain : S.holdText.trait, PAD + 32, INNER - 64, 30, '500', C.muted, 46);
        } else {
          d.lines.forEach(function (l, i) {
            var th = items[i];
            if (!dry) {
              rr(ctx, PAD + 32, y, INNER - 64, th, 20); ctx.fillStyle = l.kind === 'mixed' ? C.tan : C.soft; ctx.fill();
              ctx.fillStyle = l.kind === 'mixed' ? '#b29b5a' : C.ring; ctx.fillRect(PAD + 32, y + 14, 8, th - 28);
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

  function loadSvg(svg) {
    return new Promise(function (resolve) {
      var img = new Image();
      var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  }

  function open(model) {
    overlay = overlay || document.getElementById('overlay');
    img = img || document.getElementById('preview-img');
    saveBtn = saveBtn || document.getElementById('img-save');
    helpEl = helpEl || document.getElementById('overlay-help');
    var ready = (document.fonts && document.fonts.load) ? Promise.all(['500 20px Pretendard', '700 20px Pretendard', '800 20px Pretendard', '900 20px Pretendard'].map(function (f) { return document.fonts.load(f, '가'); })).catch(function () {}) : Promise.resolve();
    var figsReady = Promise.resolve(null);
    if (model.typeCard && window.SurveyToon) {
      var f = model.typeCard.figure;
      figsReady = Promise.all([loadSvg(window.SurveyToon(f, 'F', [])), loadSvg(window.SurveyToon(f, 'M', []))]).then(function (r) { return r[0] && r[1] ? { F: r[0], M: r[1] } : null; });
    }
    Promise.all([ready, figsReady]).then(function (res) {
      figs = res[1];
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
