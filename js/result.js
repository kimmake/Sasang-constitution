/* 응답 → 결과 요약 규칙 적용 (외부 전송 없음, 체질 점수·확률 계산 없음) */
(function () {
  var S = window.SURVEY;
  var T = S.thresholds;
  var qById = {};
  S.questions.forEach(function (q) { qById[q.id] = q; });

  function optionCount(q) { return q.options ? q.options.length : S.scales[q.scale].length; }

  // 응답이 계산에 쓰이는지 (잘 모르겠음/응답하지 않음/미응답은 제외)
  function isAnswered(q, v) {
    if (v === undefined || v === null || v === 'skip') return false;
    if (q.unanswerable && q.unanswerable.indexOf(v) !== -1) return false;
    return true;
  }

  // 0~1 환산 (5점 척도 기준). rev 는 반대 방향 문항.
  function normalize(q, v, rev) {
    var x = v / (optionCount(q) - 1);
    return rev ? 1 - x : x;
  }

  function checkTrait(trait, answers) {
    if (trait.choice) {
      var cq = qById[trait.choice.q];
      var cv = answers[cq.id];
      if (!isAnswered(cq, cv)) return { held: true, skipped: true };
      return { held: false, kind: 'single', text: trait.text[cv] };
    }
    var vals = [];
    trait.items.forEach(function (it) {
      var q = qById[it.q];
      if (isAnswered(q, answers[q.id])) vals.push(normalize(q, answers[q.id], it.rev));
    });
    var min = trait.minAnswered || (trait.items.length === 1 ? 1 : Math.max(2, Math.ceil(trait.items.length * 0.6)));
    if (vals.length < min) return { held: true };
    var hasHigh = vals.some(function (x) { return x >= T.crossHigh; });
    var hasLow = vals.some(function (x) { return x <= T.crossLow; });
    if (vals.length >= 2 && hasHigh && hasLow) return { held: false, kind: 'mixed', text: trait.text.mixed };
    var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    var kind = mean >= T.high ? 'high' : mean <= T.low ? 'low' : 'mid';
    return { held: false, kind: kind, text: trait.text[kind] };
  }

  function build(answers) {
    var core = S.questions.filter(function (q) { return q.section !== 'E'; });
    var answeredCore = core.filter(function (q) { return isAnswered(q, answers[q.id]); }).length;

    var domains = S.sections.filter(function (s) { return s.id !== 'E'; }).map(function (s) {
      var qs = core.filter(function (q) { return q.section === s.id; });
      var n = qs.filter(function (q) { return isAnswered(q, answers[q.id]); }).length;
      var held = n < Math.ceil(qs.length * T.domainMinRatio);
      var lines = [];
      var skippedNote = false;
      if (!held) {
        S.traits.filter(function (t) { return t.section === s.id; }).forEach(function (t) {
          var r = checkTrait(t, answers);
          if (r.skipped) return;
          if (r.held) { skippedNote = true; return; }
          lines.push({ text: r.text, kind: r.kind });
        });
      }
      return { id: s.id, title: s.title, total: qs.length, answered: n, held: held, lines: lines, partial: skippedNote };
    });

    var recent = S.recentChange.questions.some(function (id) { return answers[id] === S.recentChange.yesIndex; });

    return {
      total: core.length,
      answered: answeredCore,
      holdAll: answeredCore < Math.ceil(core.length * T.overallMinRatio),
      domains: domains,
      recentChange: recent ? S.recentChange.notice : ''
    };
  }

  window.SurveyResult = { build: build, isAnswered: isAnswered };
})();
