/*
 * 문항과 결과 생성 규칙 (수정은 이 파일에서만 하면 됩니다)
 *
 * - scales      : 공통 응답 보기
 * - sections    : 영역(A~E) 정의
 * - questions   : 문항. id는 번호, section은 영역, scale 또는 options 중 하나를 사용
 *     skippable      true  → "잘 모르겠음 / 응답하지 않음" 버튼을 추가로 보여주고, 답하지 않아도 넘어갈 수 있음
 *     optional       true  → 답하지 않아도 넘어갈 수 있음
 *     unanswerable   [i]   → options 중 "응답 없음"으로 취급할 보기 번호
 * - traits      : 결과 문장 규칙. 영역별로 어떤 문항 응답을 모아 어떤 문장을 보여줄지 정의
 *     items   [{q, rev}]   → 문항 번호. rev:true 이면 점수를 뒤집어 계산(반대 방향 문항)
 *     text    {high, mid, low, mixed}
 *     choice  {보기번호: 문장}  → 선택형 문항을 그대로 문장으로 보여줄 때
 *
 * 결과 규칙 (checkTrait, app.js)
 *   - 각 응답을 0~1 로 환산한 뒤 응답한 문항만 사용 (미응답은 계산에서 제외)
 *   - 한쪽은 0.75 이상, 다른 쪽은 0.25 이하이면 "엇갈림(mixed)"
 *   - 그 외에는 평균 0.7 이상 high, 0.3 이하 low, 나머지 mid
 *   - 항목의 응답 수가 minAnswered 미만이면 해당 항목은 판단 보류
 *   - 영역 안에서 응답한 문항이 60% 미만이면 영역 전체를 판단 보류
 *   체질별 점수·확률·판정은 계산하지 않습니다.
 */
window.SURVEY = {
  thresholds: { high: 0.7, low: 0.3, crossHigh: 0.75, crossLow: 0.25, domainMinRatio: 0.6, overallMinRatio: 0.6 },

  scales: {
    agree: ['전혀 그렇지 않다', '그렇지 않은 편이다', '보통이다', '그런 편이다', '매우 그렇다'],
    freq: ['전혀 없다', '드물다', '가끔 있다', '자주 있다', '거의 항상 있다']
  },

  skipLabel: '잘 모르겠음 / 응답하지 않음',

  baseInstruction: '일시적으로 아픈 날을 제외하고, 평소 자신의 모습을 기준으로 답해주세요.',

  sections: [
    { id: 'A', title: '행동·대인관계' },
    { id: 'B', title: '소화·식사' },
    { id: 'C', title: '땀·온도' },
    { id: 'D', title: '수면·생활 리듬' },
    { id: 'E', title: '최근 변화 확인', optional: true, instruction: '이 영역은 선택 응답입니다. 답하지 않아도 괜찮아요. 구체적인 질환명이나 복용약은 묻지 않습니다.' }
  ],

  questions: [
    // A. 행동·대인관계
    { id: 1, section: 'A', scale: 'agree', text: '낯선 사람에게 먼저 말을 거는 편이다.' },
    { id: 2, section: 'A', scale: 'agree', text: '여러 사람과 함께하는 활동을 즐긴다.' },
    { id: 3, section: 'A', scale: 'agree', text: '새로운 일을 시작할 때 망설임이 적다.' },
    { id: 4, section: 'A', scale: 'agree', text: '결정을 내리기 전에 여러 가능성을 충분히 검토한다.' },
    { id: 5, section: 'A', scale: 'agree', text: '일을 할 때 작은 부분까지 확인하는 편이다.' },
    { id: 6, section: 'A', scale: 'agree', text: '예상하지 못한 변화에 빠르게 적응한다.' },
    { id: 7, section: 'A', scale: 'agree', text: '자신의 의견을 다른 사람에게 분명하게 표현한다.' },
    { id: 8, section: 'A', scale: 'agree', skippable: true, text: '감정이 표정이나 말투에 쉽게 드러난다.' },
    { id: 9, section: 'A', scale: 'agree', skippable: true, text: '화가 나거나 흥분한 뒤 진정하는 데 시간이 걸린다.' },
    { id: 10, section: 'A', scale: 'agree', text: '시작한 일을 일정한 속도로 꾸준히 이어간다.' },
    { id: 11, section: 'A', scale: 'agree', text: '평소 행동이 빠른 편이다.' },

    // B. 소화·식사
    { id: 12, section: 'B', scale: 'freq', skippable: true, text: '식사 후 속이 더부룩하다.' },
    { id: 13, section: 'B', scale: 'freq', skippable: true, text: '적은 양을 먹어도 금방 배가 부르다.' },
    { id: 14, section: 'B', scale: 'freq', skippable: true, text: '식사 시간이 되어도 배고픔을 잘 느끼지 못한다.' },
    { id: 15, section: 'B', scale: 'freq', skippable: true, text: '평소 먹는 양의 식사를 하고도 속이 불편하다.' },
    { id: 16, section: 'B', scale: 'freq', skippable: true, text: '긴장하거나 스트레스를 받으면 소화 상태가 달라진다.' },

    // C. 땀·온도
    { id: 17, section: 'C', scale: 'agree', text: '가벼운 활동만 해도 땀이 쉽게 난다.' },
    { id: 18, section: 'C', scale: 'agree', text: '더운 날에도 땀이 적게 나는 편이다.' },
    { id: 19, section: 'C', scale: 'agree', skippable: true, text: '땀을 많이 흘린 뒤 기운이 떨어진다.' },
    { id: 20, section: 'C', scale: 'agree', skippable: true, text: '땀을 흘리고 나면 몸이 가벼워진다.' },
    { id: 21, section: 'C', scale: 'agree', text: '주변 사람들보다 추위를 많이 탄다.' },
    { id: 22, section: 'C', scale: 'agree', text: '주변 사람들보다 더위를 많이 탄다.' },
    { id: 23, section: 'C', scale: 'agree', skippable: true, text: '손이나 발이 차갑게 느껴지는 경우가 많다.' },
    { id: 24, section: 'C', options: ['찬물', '미지근한 물', '따뜻한 물', '특별한 선호 없음'], text: '평소 마시는 물의 온도는 무엇을 선호하나요?' },

    // D. 수면·생활 리듬
    { id: 25, section: 'D', options: ['규칙적인 편이다', '일정하지 않은 편이다', '잘 모르겠다'], unanswerable: [2], text: '평소 배변이 규칙적인 편인가요?' },
    { id: 26, section: 'D', scale: 'freq', skippable: true, text: '잠든 뒤 중간에 자주 깨나요?' },
    { id: 27, section: 'D', scale: 'freq', skippable: true, text: '충분히 잘 기회가 있었는데도 아침에 개운하지 않나요?' },

    // E. 최근 변화 확인 (선택 응답)
    { id: 28, section: 'E', optional: true, options: ['없음', '있음', '응답하지 않음'], unanswerable: [2], text: '최근 들어 평소와 달라진 신체 증상이 있나요?' },
    { id: 29, section: 'E', optional: true, options: ['없음', '있음', '응답하지 않음'], unanswerable: [2], text: '최근 수면·식사·운동 습관이 크게 달라졌나요?' }
  ],

  // 최근 변화 안내를 띄우는 문항과 "있음" 보기 번호
  recentChange: { questions: [28, 29], yesIndex: 1, notice: '최근 상태 변화가 답변에 영향을 주었을 수 있습니다.' },

  traits: [
    // ── A. 행동·대인관계
    { id: 'a-social', section: 'A', items: [{ q: 1 }, { q: 2 }, { q: 3 }],
      text: {
        high: '낯선 사람에게 먼저 다가가고, 여럿이 함께하고, 새로운 일을 시작하는 데 적극적이라고 응답했어요.',
        mid: '먼저 말을 걸거나, 여럿이 함께하거나, 새로운 일을 시작하는 정도는 보통이라고 응답했어요.',
        low: '먼저 말을 걸거나, 여럿이 함께하거나, 새로운 일을 시작하는 일은 많지 않다고 응답했어요.',
        mixed: '먼저 다가가기, 함께하기, 새로 시작하기는 상황에 따라 다르게 나타나는 편이에요.'
      } },
    { id: 'a-careful', section: 'A', items: [{ q: 4 }, { q: 5 }],
      text: {
        high: '결정 전에 여러 가능성을 살피고 작은 부분까지 확인하는 편이라고 응답했어요.',
        mid: '결정 전 검토나 세부 확인은 보통 정도라고 응답했어요.',
        low: '결정 전 검토나 세부 확인에 많은 시간을 쓰지는 않는다고 응답했어요.',
        mixed: '결정 전 검토와 세부 확인은 상황에 따라 다르게 나타나는 편이에요.'
      } },
    { id: 'a-adapt', section: 'A', items: [{ q: 6 }],
      text: {
        high: '예상하지 못한 변화에 빠르게 적응하는 편이라고 응답했어요.',
        mid: '예상하지 못한 변화에 적응하는 속도는 보통이라고 응답했어요.',
        low: '예상하지 못한 변화에는 적응하는 데 시간이 걸리는 편이라고 응답했어요.'
      } },
    { id: 'a-express', section: 'A', items: [{ q: 7 }, { q: 8 }], minAnswered: 1,
      text: {
        high: '자신의 의견과 감정을 겉으로 분명하게 드러내는 편이라고 응답했어요.',
        mid: '의견과 감정을 드러내는 정도는 보통이라고 응답했어요.',
        low: '의견과 감정을 겉으로 많이 드러내지 않는 편이라고 응답했어요.',
        mixed: '의견과 감정을 드러내는 정도는 상황에 따라 다르게 나타나는 편이에요.'
      } },
    { id: 'a-calm', section: 'A', items: [{ q: 9 }],
      text: {
        high: '화가 나거나 흥분한 뒤 진정하는 데 시간이 걸리는 편이라고 응답했어요.',
        mid: '흥분한 뒤 진정하는 시간은 보통이라고 응답했어요.',
        low: '흥분한 뒤 비교적 금방 진정하는 편이라고 응답했어요.'
      } },
    { id: 'a-steady', section: 'A', items: [{ q: 10 }],
      text: {
        high: '시작한 일을 일정한 속도로 꾸준히 이어가는 편이라고 응답했어요.',
        mid: '일을 꾸준히 이어가는 정도는 보통이라고 응답했어요.',
        low: '일을 일정한 속도로 이어가기보다 때에 따라 속도가 달라지는 편이라고 응답했어요.'
      } },
    { id: 'a-quick', section: 'A', items: [{ q: 11 }],
      text: {
        high: '평소 행동이 빠른 편이라고 응답했어요.',
        mid: '평소 행동 속도는 보통이라고 응답했어요.',
        low: '평소 행동이 천천히 이루어지는 편이라고 응답했어요.'
      } },

    // ── B. 소화·식사
    { id: 'b-discomfort', section: 'B', items: [{ q: 12 }, { q: 15 }], minAnswered: 1,
      text: {
        high: '소화 불편을 자주 경험한다고 응답했어요. (식사 후 더부룩함, 평소 양을 먹고도 불편함)',
        mid: '식사 후 더부룩함이나 속 불편함을 가끔 경험한다고 응답했어요.',
        low: '식사 후 더부룩함이나 속 불편함은 드물다고 응답했어요.',
        mixed: '식사 후 더부룩함과 속 불편함은 상황에 따라 다르게 나타나는 편이에요.'
      } },
    { id: 'b-fullness', section: 'B', items: [{ q: 13 }],
      text: {
        high: '적은 양을 먹어도 금방 배가 부르다고 자주 응답했어요.',
        mid: '적은 양에도 배가 부른 느낌은 가끔 있다고 응답했어요.',
        low: '적은 양에 금방 배가 부른 경우는 드물다고 응답했어요.'
      } },
    { id: 'b-appetite', section: 'B', items: [{ q: 14 }],
      text: {
        high: '식사 시간이 되어도 배고픔을 잘 느끼지 못하는 경우가 자주 있다고 응답했어요.',
        mid: '식사 시간에 배고픔을 느끼지 못하는 경우가 가끔 있다고 응답했어요.',
        low: '식사 시간에 배고픔을 느끼지 못하는 경우는 드물다고 응답했어요.'
      } },
    { id: 'b-stress', section: 'B', items: [{ q: 16 }],
      text: {
        high: '긴장하거나 스트레스를 받으면 소화 상태가 달라지는 경우가 자주 있다고 응답했어요.',
        mid: '긴장하거나 스트레스를 받을 때 소화 상태가 달라지는 경우가 가끔 있다고 응답했어요.',
        low: '긴장하거나 스트레스를 받아도 소화 상태가 달라지는 경우는 드물다고 응답했어요.'
      } },

    // ── C. 땀·온도
    { id: 'c-sweat', section: 'C', items: [{ q: 17 }, { q: 18, rev: true }], minAnswered: 1,
      text: {
        high: '가벼운 활동에도 땀이 쉽게 나는 편이라고 응답했어요.',
        mid: '땀이 나는 정도는 보통이라고 응답했어요.',
        low: '더운 날에도 땀이 적게 나는 편이라고 응답했어요.',
        mixed: '땀이 나는 정도는 상황에 따라 다르게 나타나는 편이에요.'
      } },
    { id: 'c-aftersweat', section: 'C', items: [{ q: 19 }, { q: 20, rev: true }], minAnswered: 1,
      text: {
        high: '땀을 많이 흘린 뒤 기운이 떨어지는 편이라고 응답했어요.',
        mid: '땀을 흘린 뒤의 느낌은 보통이라고 응답했어요.',
        low: '땀을 흘리고 나면 몸이 가벼워지는 편이라고 응답했어요.',
        mixed: '땀을 흘린 뒤의 느낌은 상황에 따라 다르게 나타나는 편이에요.'
      } },
    { id: 'c-cold', section: 'C', items: [{ q: 21 }, { q: 23 }], minAnswered: 1,
      text: {
        high: '주변 사람들보다 추위를 많이 타고, 손발이 차갑게 느껴지는 경우가 많다고 응답했어요.',
        mid: '추위를 타는 정도와 손발의 차가움은 보통이라고 응답했어요.',
        low: '추위를 많이 타지 않고 손발이 차가운 경우도 많지 않다고 응답했어요.',
        mixed: '추위를 타는 정도와 손발의 차가움은 상황에 따라 다르게 나타나는 편이에요.'
      } },
    { id: 'c-heat', section: 'C', items: [{ q: 22 }],
      text: {
        high: '주변 사람들보다 더위를 많이 타는 편이라고 응답했어요.',
        mid: '더위를 타는 정도는 보통이라고 응답했어요.',
        low: '주변 사람들보다 더위를 많이 타지는 않는다고 응답했어요.'
      } },
    { id: 'c-water', section: 'C', choice: { q: 24 },
      text: {
        0: '평소 찬물을 선호한다고 응답했어요.',
        1: '평소 미지근한 물을 선호한다고 응답했어요.',
        2: '평소 따뜻한 물을 선호한다고 응답했어요.',
        3: '마시는 물의 온도에 특별한 선호가 없다고 응답했어요.'
      } },

    // ── D. 수면·생활 리듬
    { id: 'd-bowel', section: 'D', choice: { q: 25 },
      text: {
        0: '배변이 규칙적인 편이라고 응답했어요. (생활습관 참고용으로만 보여드려요)',
        1: '배변이 일정하지 않은 편이라고 응답했어요. (생활습관 참고용으로만 보여드려요)'
      } },
    { id: 'd-wake', section: 'D', items: [{ q: 26 }],
      text: {
        high: '잠든 뒤 중간에 자주 깬다고 응답했어요.',
        mid: '잠든 뒤 중간에 깨는 경우가 가끔 있다고 응답했어요.',
        low: '잠든 뒤 중간에 깨는 경우는 드물다고 응답했어요.'
      } },
    { id: 'd-refresh', section: 'D', items: [{ q: 27 }],
      text: {
        high: '충분히 잘 기회가 있어도 아침에 개운하지 않은 경우가 자주 있다고 응답했어요.',
        mid: '충분히 자고도 아침에 개운하지 않은 경우가 가끔 있다고 응답했어요.',
        low: '충분히 자고 나면 아침이 개운하지 않은 경우는 드물다고 응답했어요.'
      } }
  ],


  /*
   * 사상체질 네 가지 유형 소개 (일반 참고 설명)
   * 설문 응답과 연결되지 않으며, 모든 사용자에게 똑같이 보여줍니다. 체질 판정·음식·약·질환 내용은 넣지 않습니다.
   * figure : 그림 비율 (head 머리 반지름, neck 목 너비, sh 어깨 너비, wa 허리 너비, hi 엉덩이 너비, leg 다리 굵기, scale 전체 크기)
   */
  typesIntro: {
    title: '사상체질 네 가지 유형 알아보기',
    note: '전통 사상의학에서 일반적으로 소개하는 네 가지 유형의 개요입니다. 이 설문의 결과와 연결되어 있지 않으며, 내가 어느 유형인지 알려주는 내용이 아니에요. 그림은 이해를 돕는 개념도이고, 실제 모습은 같은 유형 안에서도 개인차가 매우 큽니다. 체질 진단은 한의사 상담이 필요합니다.'
  },
  types: [
    { id: 'taeyang', name: '태양인', figure: { head: 21, neck: 20, sh: 64, wa: 30, hi: 34, leg: 10, scale: 1, shirt: '#7cc79a' },
      tags: ['큰 머리·굵은 목', '가슴 윗부분 발달', '가는 하체'],
      build: '머리가 크고 목덜미와 가슴 윗부분이 발달한 반면, 허리 아래쪽 하체는 상대적으로 가늘다고 설명해요.',
      character: '두뇌 회전이 빠르고 창의적·진취적이며, 사람들과 어울리는 소통 능력과 영웅심이 강하다고 설명해요. 네 유형 중 가장 드문 유형으로 알려져 있어요.' },
    { id: 'taeeum', name: '태음인', figure: { head: 17, neck: 14, sh: 62, wa: 56, hi: 58, leg: 17, scale: 1, shirt: '#5fb583' },
      tags: ['큰 골격', '허리·배 발달', '듬직한 체격'],
      build: '체격이 크고 골격이 굵으며, 허리 둘레와 배 쪽이 발달해 전체적으로 듬직한 인상이라고 설명해요.',
      character: '느긋하고 끈기 있으며 참을성이 많아 한번 정한 일을 오래 이어가는 편이지만, 변화에는 신중하다고 설명해요.' },
    { id: 'soyang', name: '소양인', figure: { head: 16, neck: 11, sh: 62, wa: 32, hi: 36, leg: 11, scale: 1, shirt: '#8fd1a2' },
      tags: ['발달한 가슴·어깨', '가벼운 하체', '민첩한 인상'],
      build: '가슴과 어깨 쪽이 발달하고 엉덩이·하체는 상대적으로 가벼워, 상체가 든든해 보인다고 설명해요.',
      character: '활달하고 민첩하며 솔직하고 사교적이지만, 서두르는 편이라 끝맺음에 신경이 필요하다고 설명해요.' },
    { id: 'soeum', name: '소음인', figure: { head: 15, neck: 11, sh: 42, wa: 34, hi: 48, leg: 14, scale: 0.9, shirt: '#a6d98e' },
      tags: ['작고 아담한 체격', '어깨보다 하체 발달', '섬세한 인상'],
      build: '전체적으로 몸집이 작고 아담하며, 어깨보다 아랫부분이 상대적으로 발달해 있다고 설명해요.',
      character: '차분하고 꼼꼼하며 섬세하고, 조용히 생각하는 편이라고 설명해요.' }
  ],

  holdText: {
    domain: '응답이 충분하지 않아 이 영역은 판단을 보류했어요.',
    trait: '응답이 부족해 이 항목은 판단을 보류했어요.',
    overall: '응답이 충분하지 않아 전체 결과는 판단을 보류했어요. 답변을 더 채우시면 응답 특성을 정리해 드릴게요.'
  },

  reference: {
    citation: '백영화 외(2015). 체형, 성격, 소증 기반 단축형 사상체질 진단설문지(KS-15) 개발 및 타당도 연구.',
    url: 'https://doi.org/10.7730/JSCM.2015.27.2.211',
    disclaimer: '위 연구는 평가 영역을 이해하기 위한 참고자료입니다. 본 설문은 원본 KS-15 및 공식 채점법을 재현한 검사가 아니며, 자체 작성한 문항이 포함되어 있습니다.'
  }
};
