/* 응답 → 결과 계산 (외부 전송 없음). 유형 점수는 KS-15 논문 부록의 가중치표 합계이며 확률은 계산하지 않습니다. */
(function () {
  var S = window.SURVEY;
  var T = S.thresholds;
  var qById = {};
  S.questions.forEach(function (q) { qById[q.id] = q; });

  function optionCount(q) { return q.options ? q.options.length : S.scales[q.scale].length; }

  // 0: 남성(M), 1: 여성(F), 미응답: null
  function sexOf(answers) {
    var v = answers[S.sexQuestion];
    return v === 0 ? 'M' : v === 1 ? 'F' : null;
  }

  // 성별에 맞는 문항만 (성별 미선택이면 성별 전용 문항은 제외)
  function visibleQuestions(answers) {
    var sex = sexOf(answers || {});
    return S.questions.filter(function (q) { return !q.onlySex || q.onlySex === sex; });
  }

  function isAnswered(q, v) {
    if (v === undefined || v === null || v === 'skip') return false;
    if (q.unanswerable && q.unanswerable.indexOf(v) !== -1) return false;
    return true;
  }

  function normalize(q, v, rev) {
    var x = v / (optionCount(q) - 1);
    return rev ? 1 - x : x;
  }

  function checkTrait(trait, answers) {
    if (trait.choice) {
      var cq = qById[trait.choice.q];
      var cv = answers[cq.id];
      if (!isAnswered(cq, cv)) return { held: true, skipped: true };
      return { held: false, kind: 'single', text: trait.text[cv], short: trait.short && trait.short[cv] };
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
    if (vals.length >= 2 && hasHigh && hasLow && trait.text.mixed) return { held: false, kind: 'mixed', text: trait.text.mixed };
    var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    var kind = mean >= T.high ? 'high' : mean <= T.low ? 'low' : 'mid';
    return { held: false, kind: kind, text: trait.text[kind], short: trait.short && trait.short[kind] };
  }

  /*
   * KS-15 점수: 성별에 해당하는 모든 KS-15 문항의 선택 보기 가중치를 체질별로 합산.
   * 점수가 모두 같으면 tie, 응답이 하나라도 빠지면 null.
   */
  function ksScores(answers) {
    var sex = sexOf(answers);
    if (!sex) return null;
    var scores = [0, 0, 0];
    var ok = true;
    visibleQuestions(answers).forEach(function (q) {
      if (!q.ks) return;
      var v = answers[q.id];
      if (!isAnswered(q, v)) { ok = false; return; }
      var w = S.ks15.weights[q.id][v][sex];
      for (var i = 0; i < 3; i++) scores[i] += w[i];
    });
    if (!ok) return null;
    var max = Math.max.apply(null, scores);
    var tops = [];
    scores.forEach(function (s, i) { if (Math.abs(s - max) < 1e-9) tops.push(i); });
    return { sex: sex, scores: scores, top: tops.length === 1 ? tops[0] : null, tie: tops.length > 1 };
  }

  function build(answers) {
    var vis = visibleQuestions(answers);
    var core = vis.filter(function (q) { return q.section !== 'E' && q.section !== 'P'; });
    var answeredCore = core.filter(function (q) { return isAnswered(q, answers[q.id]); }).length;

    var domains = S.sections.filter(function (s) { return s.id !== 'E' && s.id !== 'P'; }).map(function (s) {
      var qs = core.filter(function (q) { return q.section === s.id; });
      var n = qs.filter(function (q) { return isAnswered(q, answers[q.id]); }).length;
      var held = n < Math.ceil(qs.length * T.domainMinRatio);
      var lines = [];
      var partial = false;
      if (!held) {
        S.traits.filter(function (t) { return t.section === s.id; }).forEach(function (t) {
          var tq = qById[t.choice ? t.choice.q : t.items[0].q];
          if (tq.onlySex && tq.onlySex !== sexOf(answers)) return;
          var r = checkTrait(t, answers);
          if (r.skipped) return;
          if (r.held) { partial = true; return; }
          lines.push({ text: r.text, short: r.short || r.text, kind: r.kind });
        });
      }
      return { id: s.id, title: s.title, total: qs.length, answered: n, held: held, lines: lines, partial: partial };
    });

    var recent = S.recentChange.questions.some(function (id) { return answers[id] === S.recentChange.yesIndex; });
    var ks = ksScores(answers);

    return {
      total: core.length,
      answered: answeredCore,
      holdAll: answeredCore < Math.ceil(core.length * T.overallMinRatio),
      domains: domains,
      recentChange: recent ? S.recentChange.notice : '',
      ks: ks ? { scores: ks.scores, top: ks.top, tie: ks.tie, topName: ks.top === null ? null : S.ks15.labels[ks.top] } : null
    };
  }

  window.SurveyResult = { build: build, isAnswered: isAnswered, visibleQuestions: visibleQuestions, ksScores: ksScores, sexOf: sexOf };
})();
