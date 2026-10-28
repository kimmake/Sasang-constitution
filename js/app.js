/* 화면 처리. 응답은 이 페이지의 메모리에만 있으며 서버 전송·브라우저 저장을 하지 않습니다. */
(function () {
  var S = window.SURVEY;
  var R = window.SurveyResult;
  var app = document.getElementById('app');
  var state = { view: 'start', index: 0, answers: {}, hint: false };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function section(id) { return S.sections.filter(function (s) { return s.id === id; })[0]; }
  function optionsOf(q) { return q.options || S.scales[q.scale]; }
  function isOptional(q) { return !!(q.optional || q.skippable); }
  function answeredCount() { return Object.keys(state.answers).length; }
  function qs() { return R.visibleQuestions(state.answers); }
  function label(text) { return '<h2 class="sec-label">' + esc(text) + '</h2>'; }

  /* 도넛 통계 원 (pct 0~1). pct가 null이면 테두리만 있는 원 */
  function ring(pct, big, small, cls) {
    var r = 52, c = 2 * Math.PI * r;
    var fg = pct === null ? '' :
      '<circle cx="60" cy="60" r="' + r + '" class="ring-fg" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - pct)).toFixed(1) + '" transform="rotate(-90 60 60)"/>';
    return '<div class="ring ' + (cls || '') + '" role="img" aria-label="' + esc(big + ' ' + small) + '">' +
      '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="' + r + '" class="ring-bg"/>' + (pct === null ? '<circle cx="60" cy="60" r="' + r + '" class="ring-fg" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="0" transform="rotate(-90 60 60)"/>' : fg) + '</svg>' +
      '<div class="ring-text"><strong>' + esc(big) + '</strong><span>' + esc(small) + '</span></div></div>';
  }

  /* 응답 정도를 보여주는 5칸 막대 (선택한 보기 번호만큼 채움) */
  function battery(level) {
    var h = '';
    for (var i = 4; i >= 0; i--) h += '<i class="' + (i <= level ? 'f' : '') + '"></i>';
    return '<span class="batt" aria-hidden="true">' + h + '</span>';
  }


  /* 유형 개념도: 만화풍 인물 (굵은 윤곽선). 비율만 유형별로 다르게 그림 */
  var INK = '#2b2b2b';
  function toon(f, sex, callouts) {
    var F = sex === 'F', k = 1.5 * (f.scale || 1), cx = 100;
    var r = f.head * k * (F ? 0.95 : 1), cy = 34 + r;
    var neckW = f.neck * k * (F ? 0.9 : 1), shY = cy + r + 14;
    var shW = f.sh * k * (F ? 0.9 : 1.08), waW = f.wa * k, hiW = f.hi * k * (F ? 1.06 : 1);
    var waY = shY + 62 * (f.scale || 1), hiY = shY + 100 * (f.scale || 1);
    var legW = f.leg * k, gap = 6, feetY = hiY + 150 * (f.scale || 1), armW = 14 * (f.scale || 1) + 2;
    var skin = '#fcdcc0', top = F ? '#ffffff' : '#bfe3cd', shorts = F ? '#f6c945' : '#b79a9a';
    var o = ' stroke="' + INK + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
    var out = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="380" class="toon" viewBox="0 0 200 380" aria-hidden="true">';

    // 팔 (몸통 뒤)
    [-1, 1].forEach(function (d) {
      var x1 = cx + d * (shW / 2 - 4), y1 = shY + 8, x2 = cx + d * (shW / 2 + 12), y2 = hiY + 6;
      out += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + INK + '" stroke-width="' + (armW + 7) + '" stroke-linecap="round"/>' +
             '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + skin + '" stroke-width="' + armW + '" stroke-linecap="round"/>' +
             '<circle cx="' + x2 + '" cy="' + (y2 + 6) + '" r="' + (armW * 0.62) + '" fill="' + skin + '"' + o + '/>';
    });
    // 다리와 신발
    [-1, 1].forEach(function (d) {
      var lx = cx + d * (gap / 2 + legW / 2);
      out += '<rect x="' + (lx - legW / 2) + '" y="' + (hiY + 10) + '" width="' + legW + '" height="' + (feetY - hiY - 6) + '" rx="' + (legW / 3) + '" fill="' + skin + '"' + o + '/>' +
             '<ellipse cx="' + (lx + d * 3) + '" cy="' + (feetY + 6) + '" rx="' + (legW * 0.78) + '" ry="9" fill="#fff"' + o + '/>';
    });
    // 반바지, 상의
    out += '<rect x="' + (cx - hiW / 2) + '" y="' + (hiY - 8) + '" width="' + hiW + '" height="40" rx="10" fill="' + shorts + '"' + o + '/>';
    out += '<polygon points="' + [[cx - shW / 2, shY], [cx + shW / 2, shY], [cx + waW / 2, waY], [cx + hiW / 2, hiY], [cx - hiW / 2, hiY], [cx - waW / 2, waY]].map(function (p) { return p.join(','); }).join(' ') + '" fill="' + top + '"' + o + '/>';
    // 목
    out += '<rect x="' + (cx - neckW / 2) + '" y="' + (cy + r - 8) + '" width="' + neckW + '" height="26" fill="' + skin + '"' + o + '/>';
    // 머리카락 뒤쪽(올림머리)
    if (F) out += '<circle cx="' + (cx - r * 0.72) + '" cy="' + (cy - r * 0.92) + '" r="' + (r * 0.36) + '" fill="' + INK + '"/><circle cx="' + (cx + r * 0.72) + '" cy="' + (cy - r * 0.92) + '" r="' + (r * 0.36) + '" fill="' + INK + '"/>';
    // 얼굴
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + skin + '"' + o + '/>';
    out += '<path d="M' + (cx - r) + ' ' + (cy - 2) + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + (cy - 2) + ' Q' + cx + ' ' + (cy - r * 0.55) + ' ' + (cx - r) + ' ' + (cy - 2) + 'Z" fill="' + INK + '"/>';
    if (F) out += '<rect x="' + (cx - r * 0.95) + '" y="' + (cy - r * 0.42) + '" width="' + (r * 1.9) + '" height="' + (r * 0.26) + '" rx="4" fill="#f6c945"' + o.replace('width="4"', 'width="3"') + '/>';
    out += '<circle cx="' + (cx - r * 0.38) + '" cy="' + (cy + r * 0.16) + '" r="2.6" fill="' + INK + '"/><circle cx="' + (cx + r * 0.38) + '" cy="' + (cy + r * 0.16) + '" r="2.6" fill="' + INK + '"/>';
    out += '<ellipse cx="' + (cx - r * 0.62) + '" cy="' + (cy + r * 0.42) + '" rx="' + (r * 0.2) + '" ry="' + (r * 0.14) + '" fill="#ff9d8a"/><ellipse cx="' + (cx + r * 0.62) + '" cy="' + (cy + r * 0.42) + '" rx="' + (r * 0.2) + '" ry="' + (r * 0.14) + '" fill="#ff9d8a"/>';
    out += '<path d="M' + (cx - r * 0.22) + ' ' + (cy + r * 0.45) + ' Q' + cx + ' ' + (cy + r * 0.66) + ' ' + (cx + r * 0.22) + ' ' + (cy + r * 0.45) + '" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round"/>';

    // 설명선: 라벨(위/아래) 중앙에서 해당 부위로
    var anchors = {
      head: [cx + r * 0.62, cy - r * 0.55],
      chest: [cx - Math.max(shW / 2 - 8, r + 8), shY + 22],
      body: [cx + Math.max(shW / 2 - 8, r + 8), shY + 48],
      waist: [cx + waW / 2, waY],
      legs: [cx + legW * 0.9, hiY + 90]
    };
    callouts.forEach(function (c) {
      var a = anchors[c.part];
      // 라벨 아래(또는 위)에서 가로로 꺾어 해당 부위까지 세로로 내려오는 설명선 (얼굴을 가로지르지 않도록)
      var y0 = c.pos === 'top' ? 6 : 374;
      out += '<polyline points="100,' + y0 + ' ' + a[0] + ',' + y0 + ' ' + a[0] + ',' + a[1] + '" fill="none" stroke="' + INK + '" stroke-width="2"/>' +
             '<rect x="' + (a[0] - 4) + '" y="' + (a[1] - 4) + '" width="8" height="8" fill="' + INK + '"/>';
    });
    return out + '</svg>';
  }

  window.SurveyToon = toon;

  function figureCol(t, fig) {
    var cs = (t.callouts || []).filter(function (c) { return c.fig === fig; });
    function lab(pos) {
      var c = cs.filter(function (x) { return x.pos === pos; })[0];
      return '<p class="st-label ' + pos + '"' + (c ? '' : ' aria-hidden="true"') + '>' + (c ? esc(c.text) : '') + '</p>';
    }
    return '<div class="st-fig st-' + (fig === 'F' ? 'left' : 'right') + '">' + lab('top') + toon(t.figure, fig, cs) + lab('bottom') + '</div>';
  }

  // 유형 카드 1장 (mine이면 내 응답 행, 아니면 점수 기준 행을 추가)
  function renderTypeCard(t, mine, contrib) {
    var rows = '<tr><th scope="row">체형</th><td>' + esc(t.build) + '</td></tr>' +
      '<tr><th scope="row">성격</th><td>' + esc(t.character) + '</td></tr>';
    if (mine && contrib && contrib.length) {
      rows += '<tr><th scope="row">내 응답</th><td><p class="row-note">점수에 크게 반영된 내 응답이에요.</p><ul class="chips">' +
        contrib.map(function (x) { return '<li class="chip">' + esc(x) + '</li>'; }).join('') + '</ul></td></tr>';
    } else if (!mine) {
      rows += '<tr><th scope="row">점수 기준</th><td>' + (t.signals && t.signals.length
        ? '<p class="row-note">' + esc(S.typeResult.signalsNote) + '</p><ul class="chips">' + t.signals.map(function (x) { return '<li class="chip">' + esc(x) + '</li>'; }).join('') + '</ul>'
        : esc(S.typeResult.noSignals)) + '</td></tr>';
    }
    return '<article class="st-card' + (mine ? ' is-mine' : '') + '">' +
      '<div class="st-title">- 사상체질 -</div>' +
      '<div class="st-grid">' + figureCol(t, 'F') +
        '<div class="st-mid"><h3 class="st-name">' + esc(t.name) + '</h3>' +
          '<table class="st-table"><tbody>' + rows + '</tbody></table></div>' +
        figureCol(t, 'M') +
      '</div></article>';
  }

  // 내 유형을 뺀 나머지(또는 판별이 안 되면 네 유형 모두)
  function renderOtherTypes(m) {
    var top = m.ks && m.ks.top !== null ? m.ks.top : null;
    var list = S.types.filter(function (t) { return top === null || t.ks !== top; });
    return '<details class="fold fold-card types"><summary>' + (top === null ? esc(S.typesIntro.title) : '다른 유형도 알아보기') + '</summary><div class="fold-body">' +
      '<p class="types-note">' + esc(S.typesIntro.note) + '</p>' +
      '<div class="st-list">' + list.map(function (t) { return renderTypeCard(t, false); }).join('') + '</div></div></details>';
  }

  /* ───────── 시작 ───────── */
  function renderStart() {
    var resume = answeredCount() > 0;
    var domains = S.sections.map(function (s) {
      return '<li><span class="dom-circle">' + esc(s.short || s.id) + '</span><strong>' + esc(s.title) + '</strong>' + (s.optional ? '<em>선택</em>' : '') + '</li>';
    }).join('');
    return '' +
      '<section class="panel hero">' +
        '<h1 tabindex="-1" id="view-title">나의 사상체질<br>관련 특성 알아보기</h1>' +
        '<p class="lead">평소 행동과 신체 상태를 돌아보는 참고용 설문입니다.</p>' +
        '<p class="notice"><strong>안내</strong>체질을 확정하는 검사가 아니며 의료적 진단을 대신하지 않습니다.</p>' +
      '</section>' +

      '<section class="panel">' +
        label('이 설문은요') +
        '<div class="stats">' +
          ring(null, String(S.questions.filter(function (q) { return !q.onlySex; }).length + 1), '문항') +
          ring(null, '약 5분', '소요 시간') +
          ring(null, '0건', '서버 저장') +
        '</div>' +
        '<div class="flow" aria-label="진행 순서">' +
          '<div class="flow-box"><b>1</b>평소 모습 돌아보며 응답</div>' +
          '<div class="flow-arrow" aria-hidden="true"></div>' +
          '<div class="flow-box"><b>2</b>영역별 응답 특성 확인</div>' +
          '<div class="flow-arrow" aria-hidden="true"></div>' +
          '<div class="flow-box"><b>3</b>이미지로 저장</div>' +
        '</div>' +
      '</section>' +

      '<section class="panel">' +
        label('설문 영역') +
        '<ul class="dom-circles" aria-label="설문 영역">' + domains + '</ul>' +
        '<div class="actions-col">' +
          '<button type="button" class="btn btn-primary btn-wide" data-act="start">' + (resume ? '이어서 하기' : '시작하기') + '</button>' +
          (resume ? '<button type="button" class="btn btn-ghost btn-wide" data-act="restart">처음부터 다시 하기</button>' : '') +
        '</div>' +
      '</section>';
  }

  /* ───────── 설문 ───────── */
  function renderQuestion() {
    var list = qs();
    var q = list[state.index];
    var sec = section(q.section);
    var total = list.length;
    var pct = (state.index + 1) / total;
    var cur = state.answers[q.id];
    var scaled = !!q.scale;
    var opts = optionsOf(q).map(function (text, i) {
      var on = cur === i;
      return '<button type="button" class="opt' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-act="pick" data-v="' + i + '">' +
        (scaled ? battery(i) : '<span class="letter">' + (i + 1) + '</span>') + '<span class="opt-text">' + esc(text) + '</span></button>';
    }).join('');
    if (q.skippable) {
      var on = cur === 'skip';
      opts += '<button type="button" class="opt opt-skip' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-act="pick" data-v="skip"><span class="letter">–</span><span class="opt-text">' + esc(S.skipLabel) + '</span></button>';
    }
    var hint = state.hint ? '<p class="hint" role="alert">아직 선택하지 않으셨어요. 편하신 답을 하나 골라 주세요.</p>' : '';
    var last = state.index === total - 1;
    var secIdx = S.sections.indexOf(sec);
    var timeline = S.sections.map(function (s, i) {
      return '<li class="' + (i < secIdx ? 'done' : i === secIdx ? 'now' : '') + '"><span class="dot"></span><span class="lab"><b>' + esc(s.short || s.id) + '</b><i>' + esc(s.title) + '</i></span></li>';
    }).join('');

    return '' +
      '<section class="panel progress" aria-label="진행 상황">' +
        '<div class="progress-top"><strong>' + (state.index + 1) + ' / ' + total + '</strong><span>' + Math.round(pct * 100) + '% 진행</span></div>' +
        '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + (state.index + 1) + '"><div class="bar-fill" style="width:' + (pct * 100) + '%"></div></div>' +
        '<ol class="timeline">' + timeline + '</ol>' +
      '</section>' +
      '<section class="bubble-card">' +
        '<div class="tags"><span class="pill">' + sec.id + ' · ' + esc(sec.title) + '</span>' + (isOptional(q) ? '<span class="tag">선택 응답</span>' : '') + '</div>' +
        '<p class="instruction">' + esc(sec.instruction || S.baseInstruction) + '</p>' +
        '<h2 class="q-text" tabindex="-1" id="view-title"><span class="q-no">Q' + (state.index + 1) + '</span>' + esc(q.text) + '</h2>' +
        '<div class="opts" role="radiogroup" aria-labelledby="view-title">' + opts + '</div>' +
        hint +
        '<div class="nav">' +
          '<button type="button" class="btn btn-ghost" data-act="prev">이전</button>' +
          '<button type="button" class="btn btn-primary" data-act="next">' + (last ? '결과 보기' : '다음') + '</button>' +
        '</div>' +
      '</section>';
  }


  /* 응답과 가장 가까운 유형: 내 유형 카드를 바로 보여줌 (확률·정확도 수치는 만들지 않음) */
  function renderTypeResult(m) {
    var tr = S.typeResult;
    var inner;
    if (!m.ks) {
      inner = '<p class="hold">' + esc(S.holdText.overall) + '</p>';
    } else if (m.ks.tie) {
      inner = '<p class="hold">' + esc(tr.tie) + '</p>';
    } else {
      var t = S.types.filter(function (x) { return x.ks === m.ks.top; })[0];
      inner = '<p class="type-eyebrow">' + esc(tr.title) + '</p>' + renderTypeCard(t, true, m.ks.contrib);
    }
    var detail = '<details class="fold"><summary>점수·유의사항 보기</summary><div class="fold-body">' +
      (m.ks && !m.ks.tie ? '<table class="score-table"><thead><tr><th>유형</th><th>KS-15 가중치 합계</th></tr></thead><tbody>' +
        S.ks15.labels.map(function (name, i) {
          return '<tr' + (i === m.ks.top ? ' class="top"' : '') + '><th scope="row">' + esc(name) + '</th><td>' + m.ks.scores[i].toFixed(2) + '</td></tr>';
        }).join('') + '</tbody></table><p class="body-text">점수는 확률이 아니며, 점수 차이가 작으면 판별이 덜 뚜렷할 수 있어요.</p>' : '') +
      '<ul class="caveats">' + tr.caveats.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></details>';
    return '<section class="panel type-result">' + label('나의 결과') + inner +
      '<p class="body-text center">' + esc(tr.brief) + '</p>' + detail + '</section>';
  }

  /* 한눈에 보기: 영역별 짧은 표현만 */
  function renderGlance(m) {
    if (m.holdAll) return '<section class="panel"><p class="hold">' + esc(S.holdText.overall) + '</p></section>';
    var rows = m.domains.map(function (d) {
      var chips = d.held ? '<span class="chip hold-chip">' + esc(S.holdText.domain) + '</span>'
        : d.lines.map(function (l) { return '<span class="chip' + (l.kind === 'mixed' ? ' mixed' : '') + '">' + esc(l.short) + '</span>'; }).join('');
      return '<div class="glance-row"><h3>' + esc(d.title) + '</h3><div class="chips">' + chips + '</div></div>';
    }).join('');
    return '<section class="panel glance">' + label('한눈에 보기') + '<div class="glance-list">' + rows + '</div>' + '</section>';
  }

  /* ───────── 결과 ───────── */
  function renderResult() {
    var m = R.build(state.answers);
    var head = '' +
      '<section class="panel result-head">' +
        label('Result') +
        '<h1 tabindex="-1" id="view-title">내 응답 결과</h1>' +
        '<p class="lead">' + (m.answered === m.total ? '본 문항 ' + m.total + '개에 모두 응답하셨어요.' : '본 문항 ' + m.total + '개 중 ' + m.answered + '개에 응답하셨어요. 미응답은 계산에서 제외했어요.') + '</p>' +
        (m.recentChange ? '<p class="notice recent"><strong>안내</strong>' + esc(m.recentChange) + '</p>' : '') +
      '</section>';

    var detail = '';
    if (!m.holdAll) {
      detail = '<details class="fold fold-card"><summary>영역별 자세한 문장 보기</summary><div class="fold-body"><div class="domain-grid">' + m.domains.map(function (d) {
        var inner;
        if (d.held) inner = '<p class="hold">' + esc(S.holdText.domain) + '</p>';
        else if (!d.lines.length) inner = '<p class="hold">' + esc(S.holdText.trait) + '</p>';
        else inner = '<ul class="quotes">' + d.lines.map(function (l) {
          return '<li class="quote ' + l.kind + '">' + (l.kind === 'mixed' ? '<em>상황에 따라 달라요</em>' : '') + esc(l.text) + '</li>';
        }).join('') + '</ul>' + (d.partial ? '<p class="small-note">응답이 부족한 일부 항목은 판단을 보류했어요.</p>' : '');
        return '<section class="domain"><div class="domain-top"><div><span class="eyebrow">영역 ' + d.id + ' · 응답 ' + d.answered + '/' + d.total + '</span><h2>' + esc(d.title) + '</h2></div></div>' + inner + '</section>';
      }).join('') + '</div></div></details>';
    }

    var actions = '<div class="actions">' +
        '<button type="button" class="btn btn-primary" data-act="image">이미지로 저장하기</button>' +
        '<button type="button" class="btn btn-ghost" data-act="edit">답변 수정하기</button>' +
        '<button type="button" class="btn btn-ghost" data-act="restart">다시 하기</button>' +
      '</div>';

    var refs = '<section class="refs">' +
        '<h2>참고문헌</h2>' +
        '<p>' + esc(S.reference.citation) + '</p>' +
        '<p><a href="' + esc(S.reference.url) + '" target="_blank" rel="noopener noreferrer">' + esc(S.reference.url) + '</a></p>' +
        '<p>' + esc(S.reference.disclaimer) + '</p>' +
        S.reference.extra.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') +
      '</section>';

    return head + renderTypeResult(m) + renderGlance(m) + actions + detail + renderOtherTypes(m) + refs;
  }

  /* ───────── 공통 ───────── */
  function render() {
    app.innerHTML = state.view === 'start' ? renderStart() : state.view === 'q' ? renderQuestion() : renderResult();
    var t = document.getElementById('view-title');
    if (t) t.focus({ preventScroll: true });
    // 문항 화면은 질문 카드가 바로 보이게, 나머지 화면은 맨 위로
    var card = state.view === 'q' ? app.querySelector('.bubble-card') : null;
    window.scrollTo(0, card ? Math.max(0, card.getBoundingClientRect().top + window.pageYOffset - 12) : 0);
  }

  function refreshChoice() {
    var q = qs()[state.index];
    var cur = state.answers[q.id];
    Array.prototype.forEach.call(app.querySelectorAll('.opt'), function (b) {
      var on = String(cur) === b.getAttribute('data-v');
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', on);
    });
    var h = app.querySelector('.hint');
    if (h) h.remove();
  }

  function pick(v) {
    var q = qs()[state.index];
    state.answers[q.id] = v === 'skip' ? 'skip' : Number(v);
    if (q.id === S.sexQuestion) {
      // 성별을 바꾸면 반대 성별 전용 문항의 기존 응답은 지웁니다
      var sex = R.sexOf(state.answers);
      S.questions.forEach(function (x) { if (x.onlySex && x.onlySex !== sex) delete state.answers[x.id]; });
    }
    state.hint = false;
    refreshChoice();
  }

  function next() {
    var q = qs()[state.index];
    if (!isOptional(q) && state.answers[q.id] === undefined) {
      state.hint = true;
      if (!app.querySelector('.hint')) app.querySelector('.opts').insertAdjacentHTML('afterend', '<p class="hint" role="alert">아직 선택하지 않으셨어요. 편하신 답을 하나 골라 주세요.</p>');
      return;
    }
    state.hint = false;
    if (state.index === qs().length - 1) { state.view = 'result'; } else { state.index++; }
    render();
  }

  function prev() {
    state.hint = false;
    if (state.index === 0) { state.view = 'start'; } else { state.index--; }
    render();
  }

  function restart() {
    state = { view: 'q', index: 0, answers: {}, hint: false };
    render();
  }

  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'start') { state.view = 'q'; render(); }
    else if (act === 'pick') pick(b.getAttribute('data-v'));
    else if (act === 'next') next();
    else if (act === 'prev') prev();
    else if (act === 'restart') restart();
    else if (act === 'edit') { state.view = 'q'; state.index = qs().length - 1; render(); }
    else if (act === 'image') {
      var mm = R.build(state.answers);
      if (mm.ks && mm.ks.top !== null) mm.typeCard = S.types.filter(function (x) { return x.ks === mm.ks.top; })[0];
      window.SurveyImage.open(mm);
    }
  });

  // 노트북: 숫자키로 선택, ←/→ 로 이동
  document.addEventListener('keydown', function (e) {
    if (state.view !== 'q' || e.target.closest('#overlay') || e.ctrlKey || e.metaKey || e.altKey) return;
    var q = qs()[state.index];
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= optionsOf(q).length) pick(n - 1);
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
  });

  // 글씨 크기
  var sizes = ['100%', '118%', '136%'];
  Array.prototype.forEach.call(document.querySelectorAll('.fontsize button'), function (b) {
    b.addEventListener('click', function () {
      document.documentElement.style.fontSize = sizes[Number(b.getAttribute('data-size'))];
      Array.prototype.forEach.call(document.querySelectorAll('.fontsize button'), function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
    });
  });

  render();
})();
