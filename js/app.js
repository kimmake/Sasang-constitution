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

  /* ───────── 시작 ───────── */
  function renderStart() {
    var resume = answeredCount() > 0;
    var domains = S.sections.map(function (s) {
      return '<li><span class="dom-circle">' + s.id + '</span><strong>' + esc(s.title) + '</strong>' + (s.optional ? '<em>선택</em>' : '') + '</li>';
    }).join('');
    return '' +
      '<section class="panel hero">' +
        '<span class="eyebrow">참고용 설문</span>' +
        '<h1 tabindex="-1" id="view-title">나의 사상체질<br>관련 특성 알아보기</h1>' +
        '<p class="lead">평소 행동과 신체 상태를 돌아보는 참고용 설문입니다.</p>' +
        '<p class="notice"><strong>안내</strong>체질을 확정하는 검사가 아니며 의료적 진단을 대신하지 않습니다.</p>' +
      '</section>' +

      '<section class="panel">' +
        label('이 설문은요') +
        '<div class="stats">' +
          ring(null, String(S.questions.length), '문항') +
          ring(null, '약 7분', '소요 시간') +
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
    var q = S.questions[state.index];
    var sec = section(q.section);
    var total = S.questions.length;
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
      return '<li class="' + (i < secIdx ? 'done' : i === secIdx ? 'now' : '') + '"><span class="dot"></span><span class="lab"><b>' + s.id + '</b><i>' + esc(s.title) + '</i></span></li>';
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
        '<h2 class="q-text" tabindex="-1" id="view-title"><span class="q-no">Q' + q.id + '</span>' + esc(q.text) + '</h2>' +
        '<div class="opts" role="radiogroup" aria-labelledby="view-title">' + opts + '</div>' +
        hint +
        '<div class="nav">' +
          '<button type="button" class="btn btn-ghost" data-act="prev">이전</button>' +
          '<button type="button" class="btn btn-primary" data-act="next">' + (last ? '결과 보기' : '다음') + '</button>' +
        '</div>' +
      '</section>';
  }

  /* ───────── 결과 ───────── */
  function renderResult() {
    var m = R.build(state.answers);
    var head = '' +
      '<section class="panel result-head">' +
        label('Result') +
        '<h1 tabindex="-1" id="view-title">내 응답에서 확인된 특성</h1>' +
        '<p class="lead">체질을 확정하지 않고, 답해 주신 내용을 영역별로 정리했어요.</p>' +
        '<div class="stat-row">' + ring(m.answered / m.total, m.answered + '/' + m.total, '응답한 문항') +
          '<p class="stat-text">본 문항 ' + m.total + '개 중 <strong>' + m.answered + '개</strong>에 응답하셨어요.<br>미응답·‘잘 모르겠음’은 계산에서 제외했어요.<br><span>(최근 변화 확인 문항 제외)</span></p></div>' +
        (m.recentChange ? '<p class="notice recent"><strong>안내</strong>' + esc(m.recentChange) + '</p>' : '') +
      '</section>';

    var body;
    if (m.holdAll) {
      body = '<section class="panel"><p class="hold">' + esc(S.holdText.overall) + '</p></section>';
    } else {
      body = '<div class="domain-grid">' + m.domains.map(function (d) {
        var inner;
        if (d.held) inner = '<p class="hold">' + esc(S.holdText.domain) + '</p>';
        else if (!d.lines.length) inner = '<p class="hold">' + esc(S.holdText.trait) + '</p>';
        else inner = '<ul class="quotes">' + d.lines.map(function (l) {
          return '<li class="quote ' + l.kind + '">' + (l.kind === 'mixed' ? '<em>상황에 따라 달라요</em>' : '') + esc(l.text) + '</li>';
        }).join('') + '</ul>' + (d.partial ? '<p class="small-note">응답이 부족한 일부 항목은 판단을 보류했어요.</p>' : '');
        return '<section class="panel domain">' +
          '<div class="domain-top">' + ring(d.answered / d.total, d.answered + '/' + d.total, '응답', 'ring-sm') +
            '<div><span class="eyebrow">영역 ' + d.id + '</span><h2>' + esc(d.title) + '</h2></div></div>' +
          '<div class="flow flow-mini"><div class="flow-box">응답 ' + d.answered + '문항</div><div class="flow-arrow" aria-hidden="true"></div><div class="flow-box on">확인된 특성 ' + d.lines.length + '개</div></div>' +
          inner + '</section>';
      }).join('') + '</div>';
    }

    var foot = '' +
      '<section class="banner">이 결과는 응답을 정리한 것이며, 좋고 나쁨이나 건강 여부를 나타내지 않습니다. 체질 판정이나 의료적 진단을 대신하지 않아요. 몸 상태가 걱정되시면 전문가와 상담해 주세요.</section>' +
      '<div class="actions">' +
        '<button type="button" class="btn btn-primary" data-act="image">이미지로 저장하기</button>' +
        '<button type="button" class="btn btn-ghost" data-act="edit">답변 수정하기</button>' +
        '<button type="button" class="btn btn-ghost" data-act="restart">다시 하기</button>' +
      '</div>' +
      '<section class="refs">' +
        '<h2>참고문헌</h2>' +
        '<p>' + esc(S.reference.citation) + '<br><a href="' + esc(S.reference.url) + '" target="_blank" rel="noopener noreferrer">' + esc(S.reference.url) + '</a></p>' +
        '<p class="disclaimer">' + esc(S.reference.disclaimer) + '</p>' +
      '</section>';
    return head + body + foot;
  }

  /* ───────── 공통 ───────── */
  function render() {
    app.innerHTML = state.view === 'start' ? renderStart() : state.view === 'q' ? renderQuestion() : renderResult();
    var t = document.getElementById('view-title');
    if (t) t.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function refreshChoice() {
    var q = S.questions[state.index];
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
    var q = S.questions[state.index];
    state.answers[q.id] = v === 'skip' ? 'skip' : Number(v);
    state.hint = false;
    refreshChoice();
  }

  function next() {
    var q = S.questions[state.index];
    if (!isOptional(q) && state.answers[q.id] === undefined) {
      state.hint = true;
      if (!app.querySelector('.hint')) app.querySelector('.opts').insertAdjacentHTML('afterend', '<p class="hint" role="alert">아직 선택하지 않으셨어요. 편하신 답을 하나 골라 주세요.</p>');
      return;
    }
    state.hint = false;
    if (state.index === S.questions.length - 1) { state.view = 'result'; } else { state.index++; }
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
    else if (act === 'edit') { state.view = 'q'; state.index = S.questions.length - 1; render(); }
    else if (act === 'image') window.SurveyImage.open(R.build(state.answers));
  });

  // 노트북: 숫자키로 선택, ←/→ 로 이동
  document.addEventListener('keydown', function (e) {
    if (state.view !== 'q' || e.target.closest('#overlay') || e.ctrlKey || e.metaKey || e.altKey) return;
    var q = S.questions[state.index];
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
