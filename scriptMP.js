const activeSlideNumbers = [
  0,
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
  30, 31, 32, 33, 34
];

const slideFiles = activeSlideNumbers.map((slideNumber) => `スライド${slideNumber}.PNG`);

const slideImage = document.getElementById('slideImage');
const slideArea = document.getElementById('slideArea');
const counter = document.getElementById('counter');
const progressBar = document.getElementById('progressBar');
const personOverlay = document.getElementById('personOverlay');
const personDetailImage = document.getElementById('personDetailImage');
const personButtons = document.getElementById('personButtons');
const qualityOverlay = document.getElementById('qualityOverlay');
const questionPageOverlay = document.getElementById('questionPageOverlay');
const photoFrameOverlay = document.getElementById('photoFrameOverlay');
const scaleTableOverlay = document.getElementById('scaleTableOverlay');
const validationOverlay = document.getElementById('validationOverlay');
const radioOverlay = document.getElementById('radioOverlay');
const coverOverlay = document.getElementById('coverOverlay');
const coverNextButton = document.getElementById('coverNextButton');
const coverQuitButton = document.getElementById('coverQuitButton');
const backOverlay = document.getElementById('backOverlay');
const backButton = document.getElementById('backButton');
const inputOverlay = document.getElementById('inputOverlay');
const genderInput = document.getElementById('genderInput');
const ageInput = document.getElementById('ageInput');
const slide33NextButton = document.getElementById('slide33NextButton');
const finishOverlay = document.getElementById('finishOverlay');
const finishButton = document.getElementById('finishButton');

let currentIndex = 0;
const scaleAnswers = {};
let selectedPersonSlide = null;
let selectedPersonDetailSrc = null;
let personDetailRenderToken = 0;
let pendingWarningSlide = null;
let slideRenderToken = 0;
let startedAt = null;
let participantId = null;
let surveySubmitted = false;
const params = new URLSearchParams(window.location.search);
const isTest = params.get("test") === "1" ? "1" : "0";
let surveySubmitting = false;
let currentCaseId = null;
let currentCaseStart = null;

const caseViewEvents = [];

const caseViewTotals = {
  protective_1: 0,
  protective_2: 0,
  protective_3: 0,
  protective_4: 0,
  protective_5: 0,
  protective_6: 0,
  protective_7: 0,
  protective_8: 0,
  nonprotective_1: 0,
  nonprotective_2: 0,
  nonprotective_3: 0,
  nonprotective_4: 0,
  nonprotective_5: 0,
  nonprotective_6: 0,
  nonprotective_7: 0,
  nonprotective_8: 0
};

function getCurrentSlideNumber() {
  return activeSlideNumbers[currentIndex];
}

function createParticipantId() {
  if (window.crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `participant-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function recordSurveyStart() {
  const shouldLog = startedAt === null || participantId === null;

  if (startedAt === null) {
    startedAt = new Date().toISOString();
  }

  if (participantId === null) {
    participantId = createParticipantId();
  }

  if (shouldLog) {
    console.log('開始日時:', startedAt);
    console.log('回答者ID:', participantId);
  }
}

const editedSlideNumbers = new Set([8]);

const answerEntryMappings = [
  ['2-0', 'entry.1168670168'],
  ['2-1', 'entry.930950863'],
  ['2-2', 'entry.816492538'],
  ['3-0', 'entry.1968519439'],
  ['3-1', 'entry.1120300605'],
  ['3-2', 'entry.683734315'],
  ['4-0', 'entry.540573799'],
  ['4-1', 'entry.2051434229'],
  ['4-2', 'entry.2076449763'],
  ['5-0', 'entry.1834392905'],
  ['5-1', 'entry.1776681809'],
  ['5-2', 'entry.1605733630'],
  ['6-0', 'entry.1728229730'],
  ['9-0', 'entry.1393370204'],
  ['9-1', 'entry.1105094308'],
  ['9-2', 'entry.1634414582'],
  ['10-0', 'entry.1903535500'],
  ['10-1', 'entry.741852177'],
  ['10-2', 'entry.928471055'],
  ['11-0', 'entry.1383419596'],
  ['11-1', 'entry.426644094'],
  ['11-2', 'entry.2062870814'],
  ['30-0', 'entry.526678526'],
  ['30-1', 'entry.1057518406'],
  ['30-2', 'entry.1183275702'],
  ['31-0', 'entry.214350863'],
  ['31-1', 'entry.1503682303'],
  ['31-2', 'entry.466301198'],
  ['32-0', 'entry.380387926'],
  ['32-1', 'entry.860349186'],
  ['32-2', 'entry.1861521294']
];

const caseTotalEntryMappings = [
  ['protective_1', 'entry.538489199'],
  ['protective_2', 'entry.158975898'],
  ['protective_3', 'entry.222885980'],
  ['protective_4', 'entry.947668626'],
  ['protective_5', 'entry.150920397'],
  ['protective_6', 'entry.346180124'],
  ['protective_7', 'entry.171776858'],
  ['protective_8', 'entry.113414696'],
  ['nonprotective_1', 'entry.297051509'],
  ['nonprotective_2', 'entry.410074196'],
  ['nonprotective_3', 'entry.1315581828'],
  ['nonprotective_4', 'entry.355423620'],
  ['nonprotective_5', 'entry.539260063'],
  ['nonprotective_6', 'entry.1620541261'],
  ['nonprotective_7', 'entry.269853806'],
  ['nonprotective_8', 'entry.843228163']
];

function getCaseId(index) {
  if (index < 8) {
    return `protective_${index + 1}`;
  }

  return `nonprotective_${index - 7}`;
}

function finalizeCurrentCaseView() {
  if (currentCaseId === null || currentCaseStart === null) {
    return;
  }

  const durationMs = Math.max(0, Math.round(performance.now() - currentCaseStart));
  caseViewEvents.push({
    case: currentCaseId,
    time: durationMs
  });
  caseViewTotals[currentCaseId] += durationMs;
  currentCaseId = null;
  currentCaseStart = null;
}

function startCaseView(caseId) {
  finalizeCurrentCaseView();
  currentCaseId = caseId;
  currentCaseStart = performance.now();
}

const scaleLayouts = {
  2: { cols: [58.7, 64.1, 69.5, 74.8, 80.2], rows: [74.3, 81.0, 87.6], frameLeft: 21.1 },
  3: { cols: [57.8, 63.4, 68.9, 74.5, 80.0], rows: [65.3, 76.9, 88.5], frameLeft: 19.5, frameHeight: 11.5 },
  4: { cols: [55.0, 61.4, 67.7, 74.2, 80.6], rows: [74.4, 81.1, 87.8], frameLeft: 10.2 },
  5: { cols: [55.7, 62.0, 68.2, 74.5, 80.7], rows: [74.6, 81.1, 87.5], frameLeft: 12.2 },
  6: { cols: [39.5, 45.9, 52.3, 58.7], rows: [84.4], frameLeft: 36.1, frameHeight: 7.1 },
  9: { cols: [56.9, 62.7, 68.4, 74.1, 79.8], rows: [75.4, 82.4, 89.3], frameLeft: 17.1 },
  10: { cols: [57.8, 63.4, 68.9, 74.5, 80.0], rows: [65.3, 76.9, 88.5], frameLeft: 19.5, frameHeight: 11.5 },
  11: { cols: [56.3, 62.4, 68.5, 74.7, 80.9], rows: [75.1, 81.3, 87.6], frameLeft: 13.8 },
  30: { cols: [56.9, 62.7, 68.4, 74.1, 79.8], rows: [75.4, 82.4, 89.3], frameLeft: 17.1 },
  31: { cols: [57.8, 63.4, 68.9, 74.5, 80.0], rows: [65.3, 76.9, 88.5], frameLeft: 19.5, frameHeight: 11.5 },
  32: { cols: [56.3, 62.4, 68.5, 74.7, 80.9], rows: [75.1, 81.3, 87.6], frameLeft: 13.8 }
};

const personIconTargets = [
  { left: 21.5, top: 34.0, detailSlide: 14, color: 'blue' },
  { left: 27.8, top: 34.0, detailSlide: 15, color: 'blue' },
  { left: 34.0, top: 34.0, detailSlide: 16, color: 'blue' },
  { left: 40.3, top: 34.0, detailSlide: 17, color: 'blue' },
  { left: 21.5, top: 43.8, detailSlide: 18, color: 'blue' },
  { left: 27.8, top: 43.8, detailSlide: 19, color: 'blue' },
  { left: 34.0, top: 43.8, detailSlide: 20, color: 'blue' },
  { left: 40.3, top: 43.8, detailSlide: 21, color: 'blue' },
  { left: 54.4, top: 34.0, detailSlide: 22, color: 'yellow' },
  { left: 60.6, top: 34.0, detailSlide: 23, color: 'yellow' },
  { left: 66.9, top: 34.0, detailSlide: 24, color: 'yellow' },
  { left: 73.2, top: 34.0, detailSlide: 25, color: 'yellow' },
  { left: 54.4, top: 43.8, detailSlide: 26, color: 'yellow' },
  { left: 60.6, top: 43.8, detailSlide: 27, color: 'yellow' },
  { left: 66.9, top: 43.8, detailSlide: 28, color: 'yellow' },
  { left: 73.2, top: 43.8, detailSlide: 29, color: 'yellow' }
];

const photoFrameLayouts = {
  8: { face: 'face-01.png', left: 10.9, top: 31.6, width: 17.2, height: 27.2, className: 'photo-frame-image-wide' }
};

const photoCleanSlideNumbers = new Set([...Object.keys(photoFrameLayouts).map(Number), 34]);

const warningSlideNumbers = new Set([2, 3, 4, 5, 6, 9, 10, 11, 30, 31, 32]);

const questionTableLayouts = {
  2: { top: 30.0, left: 19.0, width: 62.0 },
  3: { top: 20.0, left: 19.0, width: 63.0 },
  4: { top: 26.5, left: 11.0, width: 73.0 },
  5: { top: 22.0, left: 12.5, width: 71.0 },
  6: { top: 30.0, left: 36.0, width: 30.0 },
  9: { top: 30.0, left: 17.0, width: 66.0 },
  10: { top: 20.0, left: 19.0, width: 63.0 },
  11: { top: 30.0, left: 14.0, width: 70.0 },
  30: { top: 28.0, left: 17.0, width: 66.0 },
  31: { top: 23.0, left: 19.0, width: 63.0 },
  32: { top: 30.0, left: 14.0, width: 70.0 }
};

const editableQuestionPages = {
  2: {
    title: '問１．緊急地震速報の有用性についておたずねします。',
    instruction: 'それぞれの文章に対してあなたのお考えを「全くそう思わない」から「非常にそう思う」までの５段階で、当てはまる数字にチェックを入れてお答えください。回答後は次ページに進んでください。',
    type: 'usefulness',
    scale: ['全くそう思わない', '2', '3', '4', '非常にそう思う']
  },
  3: {
    title: '問２．緊急地震速報の今後のあり方についておたずねします。',
    instruction: 'あなたの考えをお答えください。回答後は次ページに進んでください。',
    type: 'policy',
    scale: ['全くそう思わない', '2', '3', '4', '非常にそう思う']
  },
  4: {
    title: '問３．あなたが地震速報を受けたとして、その直後にどうすると予想しますか。',
    instruction: '回答後は次ページに進んでください。',
    type: 'behavior',
    scale: ['全くそう思わない', '2', '3', '4', '非常にそう思う']
  },
  5: {
    title: '問４．地震についてのあなたご自身の思いをおたずねします。',
    instruction: '回答後は次ページに進んでください。',
    type: 'fear',
    scale: ['全くそう思わない', '2', '3', '4', '非常にそう思う']
  },
  6: {
    title: '問５．あなたはこれまで緊急地震速報を受信した経験がありますか。',
    instruction: '回答後は次ページに進んでください。',
    type: 'experience',
    scale: ['全く受信経験がない', 'まれに受信する', 'ときどき受信する', 'しばしば受信する']
  },
  9: {
    title: 'ただいまの経験談を読んだうえで、現在の気持ちをお答え下さい。問６．緊急地震速報の有用性についておたずねします。',
    instruction: '回答後は次ページに進んでください。',
    type: 'usefulness',
    scale: ['全くそう思わない', '2', '3', '4', '非常にそう思う']
  },
  10: {
    title: '問７．緊急地震速報の今後のあり方についておたずねします。',
    instruction: '回答後は次ページに進んでください。',
    type: 'policy',
    scale: ['全くそう思わない', '2', '3', '4', '非常にそう思う']
  },
  11: {
    title: '問８．あなたが地震速報を受けたとして、その直後にどうすると予想しますか。',
    instruction: '回答後は次ページに進んでください。',
    type: 'behavior',
    scale: ['全くそう思わない', '2', '3', '4', '非常にそう思う']
  },
  30: {
    title: 'ただいまの情報を確認した上で、現在の気持ちをお答え下さい。　問９．緊急地震速報の有用性についておたずねします。',
    instruction: '回答後は次ページに進んでください。',
    type: 'usefulness',
    scale: ['全くそう思わない', '2', '3', '4', '非常にそう思う']
  },
  31: {
    title: '問10．緊急地震速報の今後のあり方についておたずねします。',
    instruction: '回答後は次ページに進んでください。',
    type: 'policy',
    scale: ['全くそう思わない', '2', '3', '4', '非常にそう思う']
  },
  32: {
    title: '問11．あなたが地震速報を受けたとして、その直後にどうすると予想しますか。',
    instruction: '回答後は次ページに進んでください。',
    type: 'behavior',
    scale: ['全くそう思わない', '2', '3', '4', '非常にそう思う']
  }
};

const scaleQuestionSets = {
  usefulness: [
    '緊急地震速報は防災に役立つ',
    '緊急地震速報は地震から命を守れる',
    '緊急地震速報は地震による負傷を防げる'
  ],
  policy: [
    '厳しい財政状況下ではあっても、緊急地\n震速報に国の予算をかけるべき',
    'わが国は緊急地震速報の精度向上に優先\n的に取り組むべき',
    '緊急地震速報のシステムは社会的なコス\nトを負ってでも維持すべき'
  ],
  behavior: [
    'ただちに自分の身を守る行動をとる',
    'そのまま身構えて揺れを待つだけ',
    '携帯やテレビの速報を確認しようとする'
  ],
  fear: [
    '地震が恐ろしい',
    '地震により被害を受ける可能性が高い',
    '地震で負傷したら、重篤なものになる'
  ],
  experience: [
    '全く受信経験がない',
    'まれに受信する',
    'ときどき受信する',
    'しばしば受信する'
  ]
};

const scaleTableSets = {
  2: { type: 'usefulness', image: 'usefulness', left: 21.17, top: 40.11, width: 62.03, height: 54.86 },
  3: { type: 'policy', compact: true, image: 'policy', left: 19.53, top: 23.75, width: 63.36, height: 70.56 },
  4: { type: 'behavior', frameLeft: 10.2, image: 'behavior', left: 10.23, top: 34.44, width: 73.83, height: 56.39 },
  5: { type: 'fear', frameLeft: 12.2, image: 'fear', left: 12.19, top: 34.03, width: 71.88, height: 56.81 },
  6: { type: 'experience', image: 'experience', left: 36.25, top: 34.44, width: 25.70, height: 53.33 },
  9: { type: 'usefulness', frameLeft: 17.1, image: 'usefulness', left: 17.11, top: 34.72, width: 65.78, height: 58.19 },
  10: { type: 'policy', compact: true, image: 'policy', left: 19.53, top: 23.75, width: 63.36, height: 70.56 },
  11: { type: 'behavior', frameLeft: 13.8, image: 'behavior', left: 13.75, top: 34.03, width: 70.31, height: 56.81 },
  30: { type: 'usefulness', frameLeft: 17.1, image: 'usefulness', left: 17.11, top: 34.72, width: 65.78, height: 58.19 },
  31: { type: 'policy', compact: true, image: 'policy', left: 19.53, top: 23.75, width: 63.36, height: 70.56 },
  32: { type: 'behavior', frameLeft: 13.8, image: 'behavior', left: 13.75, top: 34.03, width: 70.31, height: 56.81 }
};

const qualityRegions = {
  2: [{ left: 20.8, top: 35.0, width: 62.8, height: 56.8 }],
  3: [{ left: 19.2, top: 23.4, width: 64.0, height: 71.0 }],
  4: [{ left: 9.8, top: 29.8, width: 74.5, height: 62.0 }],
  5: [{ left: 12.0, top: 31.0, width: 72.0, height: 61.0 }],
  6: [{ left: 36.0, top: 30.0, width: 26.2, height: 58.0 }],
  9: [{ left: 16.8, top: 35.0, width: 66.5, height: 58.2 }],
  10: [{ left: 19.2, top: 23.4, width: 64.0, height: 71.0 }],
  11: [{ left: 13.6, top: 30.0, width: 70.8, height: 61.0 }],
  31: [{ left: 19.2, top: 23.4, width: 64.0, height: 71.0 }],
  32: [{ left: 13.6, top: 30.0, width: 70.8, height: 61.0 }]
};

const slideTextMasks = {
  1: [{ left: 9.3, top: 15.0, width: 66.5, height: 5.4 }],
  8: [
    {
      left: 158 / 1280 * 100, top: 85 / 720 * 100, width: 650 / 1280 * 100, height: 48 / 720 * 100,
      className: 'slide-text-mask',
      html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 48" width="100%" height="100%" style="display:block"><text x="6" y="39" fill="#000000" font-family="Yu Gothic, Yu Gothic UI, sans-serif" font-size="37.333333" font-weight="400">佐藤さん 宮城県在住 48歳 会社員 男性</text></svg>'
    },
    {
      left: 452 / 1280 * 100, top: 184 / 720 * 100, width: 650 / 1280 * 100, height: 402 / 720 * 100,
      className: 'slide-text-mask',
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 402" width="100%" height="100%" style="display:block;overflow:visible">
        <text transform="translate(0 24)" fill="#000000" font-family="Yu Gothic, Yu Gothic UI, sans-serif" font-size="37.333333" font-weight="400"><tspan x="0" y="32">居間でテレビを見ていたら、突然、テ</tspan><tspan x="0" y="77">レビとスマホから緊急地震速報が流れ</tspan><tspan x="0" y="122">てきました。</tspan><tspan x="0" y="186" textLength="650" lengthAdjust="spacing">室内を確認しつつ、急いでテーブルの</tspan><tspan x="0" y="231" textLength="650" lengthAdjust="spacing">下にもぐったのですが、まさにその直</tspan><tspan x="0" y="276">後に大きな揺れがやってきました。</tspan><tspan x="0" y="344" textLength="650" lengthAdjust="spacing">緊急地震速報は役に立つと実感しました。</tspan></text>
      </svg>`
    },
    { left: 19.5, top: 89.0, width: 69.5, height: 5.0, className: 'slide-small-instruction', text: '内容を理解したら、次ページに進んでください。' }
  ],
  12: [
    { left: 9.0, top: 22.8, width: 75.0, height: 75.8, className: 'slide-text-mask' },
    { left: 84.0, top: 22.8, width: 7.8, height: 60.4, className: 'slide-text-mask' },
    { left: 84.0, top: 90.0, width: 7.8, height: 8.6, className: 'slide-text-mask' },
    { left: 90.45, top: 83.45, width: 0.38, height: 1.55, className: 'slide-text-mask' },
    {
      left: 15.0,
      top: 25.8,
      width: 71.4,
      height: 66.0,
      className: 'slide-info-card',
      html: `
        <p>この4月20日（月）の緊急地震速報を受けた住民358名の行動を調査した結果を次ページに示します。</p>
        <p>防護行動をした人としなかった人の割合が示されており、加えて、<span class="slide-info-emphasis">グラフ中の丸いアイコンをクリックすると個人の行動記録が表示されます。</span></p>
        <p>自由に丸いアイコンをクリックして「おおむね住民の行動が把握できた」と納得できたら、<span class="slide-info-button-label">確認終了</span>ボタンをクリックし質問ページに進んで下さい。</p>
      `
    }
  ]
};

const scaleImageControlRatios = {
  usefulness: {
    cols: [0.4604, 0.5248, 0.5892, 0.6536, 0.7180],
    rows: [0.5261, 0.6157, 0.7052]
  },
  policy: {
    cols: [0.4604, 0.5248, 0.5892, 0.6536, 0.7180],
    rows: [0.4243, 0.5546, 0.6849]
  },
  behavior: {
    cols: [0.4604, 0.5248, 0.5892, 0.6536, 0.7180],
    rows: [0.5332, 0.6199, 0.7066]
  },
  fear: {
    cols: [0.4604, 0.5248, 0.5892, 0.6536, 0.7180],
    rows: [0.5332, 0.6199, 0.7066]
  },
  experience: {
    cols: [0.125, 0.375, 0.625, 0.875],
    rows: [0.936]
  }
};

function getScaleControlLayout(slideNumber) {
  const baseLayout = scaleLayouts[slideNumber];
  const tableConfig = scaleTableSets[slideNumber];
  const ratios = tableConfig?.image ? scaleImageControlRatios[tableConfig.image] : null;

  if (!baseLayout || !tableConfig || !ratios) {
    return baseLayout;
  }

  return {
    ...baseLayout,
    cols: ratios.cols.map((ratio) => tableConfig.left + tableConfig.width * ratio),
    rows: ratios.rows.map((ratio) => tableConfig.top + tableConfig.height * ratio)
  };
}

function getSlideSrc(slideNumber) {
  if (slideNumber === 0) {
    return 'slides/cover-slide.jpg';
  }

  if (slideNumber >= 14 && slideNumber <= 29) {
    return getSlideSrc(30);
  }

  if (photoCleanSlideNumbers.has(slideNumber)) {
    return `slides/photo-clean/スライド${slideNumber}.PNG?v=marker-clean-20260807`;
  }

  const folder = editedSlideNumbers.has(slideNumber) ? 'slides/edited' : 'slides';
  return `${folder}/スライド${slideNumber}.PNG`;
}

function updateOverlayMetrics() {
  const areaRect = slideArea.getBoundingClientRect();
  const imageRatio = slideImage.naturalWidth / slideImage.naturalHeight;
  const areaRatio = areaRect.width / areaRect.height;
  let width = areaRect.width;
  let height = areaRect.height;

  if (!Number.isFinite(imageRatio)) {
    return;
  }

  if (areaRatio > imageRatio) {
    width = areaRect.height * imageRatio;
  } else {
    height = areaRect.width / imageRatio;
  }

  [personOverlay, qualityOverlay, questionPageOverlay, photoFrameOverlay, scaleTableOverlay, validationOverlay, inputOverlay, radioOverlay, coverOverlay, backOverlay, finishOverlay].forEach((overlay) => {
    overlay.style.left = `${(areaRect.width - width) / 2}px`;
    overlay.style.top = `${(areaRect.height - height) / 2}px`;
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
  });
}

function getRenderedSlideRect() {
  const areaRect = slideArea.getBoundingClientRect();
  const imageRatio = slideImage.naturalWidth / slideImage.naturalHeight;
  const areaRatio = areaRect.width / areaRect.height;
  let width = areaRect.width;
  let height = areaRect.height;

  if (!Number.isFinite(imageRatio)) {
    return areaRect;
  }

  if (areaRatio > imageRatio) {
    width = areaRect.height * imageRatio;
  } else {
    height = areaRect.width / imageRatio;
  }

  return {
    left: areaRect.left + (areaRect.width - width) / 2,
    top: areaRect.top + (areaRect.height - height) / 2,
    width,
    height
  };
}

function renderQualityOverlay() {
  const slideNumber = getCurrentSlideNumber();
  const regions = qualityRegions[slideNumber];
  qualityOverlay.replaceChildren();
  qualityOverlay.classList.toggle('hidden', !regions);

  if (!regions) {
    return;
  }

  regions.forEach((region) => {
    const patch = document.createElement('div');
    patch.className = 'quality-region';
    patch.style.left = `${region.left}%`;
    patch.style.top = `${region.top}%`;
    patch.style.width = `${region.width}%`;
    patch.style.height = `${region.height}%`;
    patch.style.backgroundImage = `url("${getSlideSrc(slideNumber)}")`;
    patch.style.backgroundSize = `${10000 / region.width}% ${10000 / region.height}%`;
    patch.style.backgroundPosition = `${(region.left / (100 - region.width)) * 100}% ${(region.top / (100 - region.height)) * 100}%`;
    qualityOverlay.append(patch);
  });
}

function renderSlideTextMasks() {
  const slideNumber = getCurrentSlideNumber();
  const masks = slideTextMasks[slideNumber];
  qualityOverlay.replaceChildren();
  qualityOverlay.classList.toggle('hidden', !masks);

  if (!masks) {
    return;
  }

  masks.forEach((mask) => {
    const element = document.createElement('div');
    element.className = mask.className ?? 'slide-text-mask';
    element.style.left = `${mask.left}%`;
    element.style.top = `${mask.top}%`;
    element.style.width = `${mask.width}%`;
    element.style.height = `${mask.height}%`;
    if (mask.html) {
      element.innerHTML = mask.html;
    } else if (mask.text) {
      element.textContent = mask.text;
    }
    qualityOverlay.append(element);
  });
}

function renderScaleTable() {
  const slideNumber = getCurrentSlideNumber();
  const layout = scaleLayouts[slideNumber];
  const tableConfig = scaleTableSets[slideNumber];
  scaleTableOverlay.replaceChildren();
  scaleTableOverlay.classList.toggle('hidden', !layout || !tableConfig);

  if (!layout || !tableConfig) {
    return;
  }

  if (tableConfig.image) {
    const tableImage = document.createElement('img');
    tableImage.className = 'scale-table-image';
    tableImage.src = `assets/excel-tables/${tableConfig.image}.png`;
    tableImage.alt = '';
    tableImage.style.left = `${tableConfig.left}%`;
    tableImage.style.top = `${tableConfig.top}%`;
    tableImage.style.width = `${tableConfig.width}%`;
    tableImage.style.height = `${tableConfig.height}%`;
    scaleTableOverlay.append(tableImage);
    return;
  }

  const questions = scaleQuestionSets[tableConfig.type];
  const frameLeft = tableConfig.frameLeft ?? layout.frameLeft ?? 18;
  const firstCol = layout.cols[0];
  const lastCol = layout.cols[layout.cols.length - 1];
  const colGap = layout.cols.length > 1 ? layout.cols[1] - layout.cols[0] : 6.4;
  const numberLeft = firstCol - colGap / 2;
  const tableLeft = tableConfig.tableLeft ?? frameLeft;
  const tableRight = tableConfig.tableRight ?? lastCol + colGap / 2;
  const rowHeight = tableConfig.rowHeight ?? layout.frameHeight ?? 6.1;
  const tableTop = layout.rows[0] - rowHeight / 2;
  const textWidth = Math.max(0, numberLeft - tableLeft);
  const numberWidth = Math.max(0, tableRight - numberLeft);
  const labelTop = tableConfig.labelTop ?? Math.max(23, tableTop - 30.8);

  if (tableConfig.experienceLabels) {
    const labelPatch = document.createElement('div');
    labelPatch.className = 'scale-label-patch';
    labelPatch.style.left = `${numberLeft - 1.0}%`;
    labelPatch.style.top = `${labelTop}%`;
    labelPatch.style.width = `${numberWidth + 2.0}%`;
    labelPatch.style.height = `${tableTop - labelTop}%`;
    scaleTableOverlay.append(labelPatch);

    questions.forEach((labelText, labelIndex) => {
      const label = document.createElement('div');
      label.className = 'scale-vertical-label scale-vertical-label-experience';
      label.textContent = labelText;
      label.style.left = `${layout.cols[labelIndex]}%`;
      label.style.top = `${labelTop + 0.5}%`;
      label.style.height = `${tableTop - labelTop - 1.0}%`;
      scaleTableOverlay.append(label);
    });
  } else if (!tableConfig.hideLabels) {
    const labelPatch = document.createElement('div');
    labelPatch.className = 'scale-label-patch';
    labelPatch.style.left = `${numberLeft - 1.4}%`;
    labelPatch.style.top = `${labelTop - 0.2}%`;
    labelPatch.style.width = `${numberWidth + 2.8}%`;
    labelPatch.style.height = `${tableTop - labelTop + 0.4}%`;
    scaleTableOverlay.append(labelPatch);

    const lowLabel = document.createElement('div');
    lowLabel.className = 'scale-vertical-label';
    lowLabel.textContent = '全くそう思わない';
    lowLabel.style.left = `${layout.cols[0]}%`;
    lowLabel.style.top = `${labelTop + 0.5}%`;
    lowLabel.style.height = `${tableTop - labelTop - 1.0}%`;
    scaleTableOverlay.append(lowLabel);

    const highLabel = document.createElement('div');
    highLabel.className = 'scale-vertical-label';
    highLabel.textContent = '非常にそう思う';
    highLabel.style.left = `${layout.cols[layout.cols.length - 1]}%`;
    highLabel.style.top = `${labelTop + 0.5}%`;
    highLabel.style.height = `${tableTop - labelTop - 1.0}%`;
    scaleTableOverlay.append(highLabel);
  }

  if (tableConfig.noQuestionColumn) {
    return;
  }

  layout.rows.forEach((rowTop, rowIndex) => {
    const patchInsetX = 0.12;
    const patchInsetY = 0.18;
    const textPatch = document.createElement('div');
    textPatch.className = 'scale-text-patch';
    textPatch.style.left = `${tableLeft + patchInsetX}%`;
    textPatch.style.top = `${rowTop - rowHeight / 2 + patchInsetY}%`;
    textPatch.style.width = `${textWidth - patchInsetX * 2}%`;
    textPatch.style.height = `${rowHeight - patchInsetY * 2}%`;
    scaleTableOverlay.append(textPatch);

    const question = document.createElement('div');
    const questionTopInset = tableConfig.compact ? 0.02 : 0.18;
    const questionHeightInset = tableConfig.compact ? 0.04 : 0.36;
    const questionSideInset = tableConfig.compact ? 0.18 : 0.45;
    question.className = `scale-question-text${tableConfig.compact ? ' scale-question-text-compact' : ''}`;
    question.textContent = questions[rowIndex] ?? '';
    question.style.left = `${tableLeft + questionSideInset}%`;
    question.style.top = `${rowTop - rowHeight / 2 + questionTopInset}%`;
    question.style.width = `${textWidth - questionSideInset * 2}%`;
    question.style.height = `${rowHeight - questionHeightInset}%`;
    scaleTableOverlay.append(question);
  });
}

function getUnansweredRows(slideNumber) {
  const layout = scaleLayouts[slideNumber];

  if (!layout || !warningSlideNumbers.has(slideNumber)) {
    return [];
  }

  return layout.rows
    .map((_, rowIndex) => rowIndex)
    .filter((rowIndex) => scaleAnswers[`${slideNumber}-${rowIndex}`] === undefined);
}

function hideValidationWarning() {
  validationOverlay.replaceChildren();
  validationOverlay.classList.add('hidden');
  questionPageOverlay.querySelectorAll('.html-scale-row-unanswered').forEach((row) => {
    row.classList.remove('html-scale-row-unanswered');
  });
  inputOverlay.querySelectorAll('.inline-input-unanswered').forEach((input) => {
    input.classList.remove('inline-input-unanswered');
  });
  const inputMessage = inputOverlay.querySelector('.input-validation-message');
  if (inputMessage) {
    inputMessage.remove();
  }
  const message = questionPageOverlay.querySelector('.html-validation-message');
  if (message) {
    message.classList.add('hidden');
  }
  pendingWarningSlide = null;
}

function getUnansweredInputFields() {
  if (getCurrentSlideNumber() !== 33) {
    return [];
  }

  return [genderInput, ageInput].filter((input) => input.value.trim() === '');
}

function renderInputValidationWarning(unansweredFields) {
  inputOverlay.querySelectorAll('.inline-input-unanswered').forEach((input) => {
    input.classList.remove('inline-input-unanswered');
  });

  unansweredFields.forEach((input) => {
    input.classList.add('inline-input-unanswered');
  });

  let message = inputOverlay.querySelector('.input-validation-message');
  if (!message) {
    message = document.createElement('div');
    message.className = 'input-validation-message';
    inputOverlay.append(message);
  }

  message.textContent = '赤枠の項目はまだ回答されていませんが、先へ進んでもよろしいでしょうか？';
}

function renderValidationWarning(unansweredRows) {
  const slideNumber = getCurrentSlideNumber();
  const layout = scaleLayouts[slideNumber];
  validationOverlay.replaceChildren();

  if (editableQuestionPages[slideNumber]) {
    questionPageOverlay.querySelectorAll('.html-scale-row-unanswered').forEach((row) => {
      row.classList.remove('html-scale-row-unanswered');
    });
    unansweredRows.forEach((rowIndex) => {
      const row = questionPageOverlay.querySelector(`[data-row-index="${rowIndex}"]`);
      if (row) {
        row.classList.add('html-scale-row-unanswered');
      }
    });
    const message = questionPageOverlay.querySelector('.html-validation-message');
    if (message) {
      message.classList.remove('hidden');
    }
    validationOverlay.classList.add('hidden');
    return;
  }

  if (!layout || unansweredRows.length === 0) {
    validationOverlay.classList.add('hidden');
    return;
  }

  unansweredRows.forEach((rowIndex) => {
    const rowFrame = document.createElement('div');
    const frameLeft = layout.frameLeft ?? layout.cols[0] - 3.2;
    const lastCol = layout.cols[layout.cols.length - 1];
    const rowTop = layout.rows[rowIndex];
    const frameHeight = layout.frameHeight ?? 5.8;

    rowFrame.className = 'unanswered-frame';
    rowFrame.style.left = `${frameLeft}%`;
    rowFrame.style.top = `${rowTop - frameHeight / 2}%`;
    rowFrame.style.width = `${lastCol - frameLeft + 3.2}%`;
    rowFrame.style.height = `${frameHeight}%`;
    validationOverlay.append(rowFrame);
  });

  const message = document.createElement('div');
  message.className = 'validation-message';
  message.textContent = '赤枠の問いはまだ回答されていませんが、先へ進んでもよろしいでしょうか？';
  validationOverlay.append(message);
  validationOverlay.classList.remove('hidden');
}

function handleAdvanceRequest() {
  const slideNumber = getCurrentSlideNumber();

  if (slideNumber === 34) {
    finishSite();
    return;
  }

  if (slideNumber === 33) {
    const unansweredFields = getUnansweredInputFields();

    if (unansweredFields.length === 0) {
      hideValidationWarning();
      showNext();
      return;
    }

    if (pendingWarningSlide === slideNumber) {
      hideValidationWarning();
      showNext();
      return;
    }

    pendingWarningSlide = slideNumber;
    renderInputValidationWarning(unansweredFields);
    return;
  }

  const unansweredRows = getUnansweredRows(slideNumber);

  if (unansweredRows.length === 0) {
    hideValidationWarning();
    showNext();
    return;
  }

  if (pendingWarningSlide === slideNumber) {
    hideValidationWarning();
    showNext();
    return;
  }

  pendingWarningSlide = slideNumber;
  renderValidationWarning(unansweredRows);
}

function renderPersonControls() {
  const isPersonGraphSlide = getCurrentSlideNumber() === 13;
  personButtons.replaceChildren();
  personOverlay.classList.toggle('hidden', !isPersonGraphSlide);

  if (!isPersonGraphSlide) {
    personDetailRenderToken += 1;
    selectedPersonSlide = null;
    selectedPersonDetailSrc = null;
    personDetailImage.classList.add('hidden');
    personDetailImage.removeAttribute('src');
    personDetailImage.alt = '';
    return;
  }

  if (selectedPersonDetailSrc === null) {
    personDetailImage.classList.add('hidden');
  } else if (personDetailImage.getAttribute('src') !== selectedPersonDetailSrc) {
    const renderToken = ++personDetailRenderToken;
    // Hide the old bitmap and its CSS margins until the new image is decoded.
    personDetailImage.classList.add('hidden');
    personDetailImage.src = selectedPersonDetailSrc;
    personDetailImage.alt = '人物の吹き出し';
    personDetailImage.decode().then(() => {
      if (renderToken === personDetailRenderToken && getCurrentSlideNumber() === 13) {
        personDetailImage.classList.remove('hidden');
      }
    }).catch(() => {
      // Keep failed or superseded image requests hidden.
    });
  }

  personIconTargets.forEach((target, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `person-button person-button-${target.color}`;
    button.style.left = `${target.left}%`;
    button.style.top = `${target.top}%`;
    button.setAttribute('aria-label', `人物 ${index + 1} の吹き出しを表示`);
    button.addEventListener('click', () => {
      startCaseView(getCaseId(index));
      selectedPersonSlide = null;
      selectedPersonDetailSrc = `assets/person-details/スライド${target.detailSlide}.PNG?v=tanaka-face-widen-20260831`;
      renderPersonControls();
      renderPhotoFrameEditor();
    });
    personButtons.append(button);
  });
}

function getPhotoFrameState(slideNumber) {
  const layout = photoFrameLayouts[slideNumber];
  const saved = localStorage.getItem(`photo-frame-position-${slideNumber}`);

  if (!layout) {
    return null;
  }

  if (!saved) {
    return { left: layout.left, top: layout.top };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      left: Number(parsed.left) || layout.left,
      top: Number(parsed.top) || layout.top
    };
  } catch {
    return { left: layout.left, top: layout.top };
  }
}

function renderPhotoFrameEditor() {
  const visibleSlideNumber = getCurrentSlideNumber();
  const slideNumber = visibleSlideNumber === 13 && selectedPersonSlide !== null ? selectedPersonSlide : visibleSlideNumber;
  const layout = photoFrameLayouts[slideNumber];
  photoFrameOverlay.replaceChildren();
  photoFrameOverlay.classList.toggle('hidden', !layout);

  if (!layout) {
    return;
  }

  const state = getPhotoFrameState(slideNumber);
  const frame = document.createElement('div');
  const image = document.createElement('img');

  frame.className = 'photo-frame-editor';
  frame.style.left = `${state.left}%`;
  frame.style.top = `${state.top}%`;
  frame.style.width = `${layout.width}%`;
  frame.style.height = `${layout.height}%`;

  image.className = `photo-frame-image ${layout.className ?? ''}`.trim();
  image.src = `assets/faces/${layout.face}?v=sato-face-file-widen-20260831`;
  image.alt = '';

  frame.prepend(image);
  photoFrameOverlay.append(frame);
}

function getEditableValue(slideNumber, key, fallback) {
  const savedValue = localStorage.getItem(`question-page-${slideNumber}-${key}`);
  if (savedValue === null) {
    return fallback;
  }
  if (key === 'instruction' && savedValue.trim() === '') {
    return fallback;
  }
  return savedValue;
}

function formatQuestionPageText(slideNumber, key, value) {
  if (key === 'title' && (slideNumber === 9 || slideNumber === 30)) {
    return value.replace(/。\s*問/, '。\n問');
  }
  return value;
}

function makeEditableText(slideNumber, key, className, fallback) {
  const element = document.createElement('div');
  element.className = className;
  element.textContent = formatQuestionPageText(slideNumber, key, getEditableValue(slideNumber, key, fallback));
  return element;
}

function renderQuestionPage() {
  const slideNumber = getCurrentSlideNumber();
  const page = editableQuestionPages[slideNumber];
  questionPageOverlay.replaceChildren();
  questionPageOverlay.classList.toggle('hidden', !page);

  if (!page) {
    return;
  }

  const questions = scaleQuestionSets[page.type];
  const shell = document.createElement('div');
  shell.className = `html-question-page html-question-page-${page.type}`;

  const header = document.createElement('div');
  header.className = 'html-question-header';
  header.append(
    makeEditableText(slideNumber, 'title', 'html-question-title', page.title),
    makeEditableText(slideNumber, 'instruction', 'html-question-instruction', page.instruction)
  );

  const table = document.createElement('div');
  const tableLayout = questionTableLayouts[slideNumber];
  table.className = `html-scale-table html-scale-table-${page.type}`;
  table.style.setProperty('--scale-count', String(page.scale.length));
  if (tableLayout) {
    table.classList.add('html-scale-table-manual');
    table.style.top = `${tableLayout.top}%`;
    table.style.left = `${tableLayout.left}%`;
    table.style.width = `${tableLayout.width}%`;
    if (tableLayout.height !== undefined) {
      table.style.height = `${tableLayout.height}%`;
    }
  }

  if (page.type === 'experience') {
    const experienceRow = document.createElement('div');
    experienceRow.className = 'html-experience-row';

    page.scale.forEach((label, colIndex) => {
      const answerKey = `${slideNumber}-0`;
      const cell = document.createElement('label');
      const input = document.createElement('input');
      const labelText = makeEditableText(slideNumber, `scale-${colIndex}`, 'html-experience-label-text', label);
      const number = document.createElement('span');

      cell.className = 'html-experience-choice';
      input.type = 'radio';
      input.name = `scale-${answerKey}`;
      input.value = String(colIndex + 1);
      input.checked = scaleAnswers[answerKey] === String(colIndex + 1);
      input.addEventListener('change', () => {
        scaleAnswers[answerKey] = input.value;
        experienceRow.classList.remove('html-scale-row-unanswered');
        if (pendingWarningSlide === slideNumber) {
          const unansweredRows = getUnansweredRows(slideNumber);
          if (unansweredRows.length === 0) {
            hideValidationWarning();
          } else {
            renderValidationWarning(unansweredRows);
          }
        }
      });
      number.className = 'html-experience-number';
      number.textContent = String(colIndex + 1);
      cell.append(input, labelText, number);
      experienceRow.append(cell);
    });

    experienceRow.dataset.rowIndex = '0';
    table.append(experienceRow);
    const footer = document.createElement('div');
    footer.className = 'html-question-footer';
    const warning = document.createElement('div');
    warning.className = 'html-validation-message hidden';
    warning.textContent = '赤枠の問いはまだ回答されていませんが、先へ進んでもよろしいでしょうか？';
    const nextButton = document.createElement('button');
    nextButton.className = 'html-next-button';
    nextButton.type = 'button';
    nextButton.setAttribute('aria-label', '次のページへ進む');
    nextButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleAdvanceRequest();
    });
    footer.append(warning, nextButton);
    shell.append(header, table, footer);
    questionPageOverlay.append(shell);
    return;
  }

  const labelRow = document.createElement('div');
  labelRow.className = 'html-scale-label-row';
  const labelSpacer = document.createElement('div');
  labelSpacer.className = 'html-scale-question-label-spacer';
  labelRow.append(labelSpacer);

  page.scale.forEach((label, colIndex) => {
    const labelCell = document.createElement('div');
    labelCell.className = 'html-scale-label-cell';
    if (colIndex === 0 || colIndex === page.scale.length - 1 || page.type === 'experience') {
      labelCell.append(makeEditableText(slideNumber, `scale-${colIndex}`, 'html-scale-label-text', label));
    }
    labelRow.append(labelCell);
  });
  table.append(labelRow);

  questions.forEach((questionText, rowIndex) => {
    const answerKey = `${slideNumber}-${rowIndex}`;
    const row = document.createElement('div');
    row.className = 'html-scale-row';
    row.dataset.rowIndex = String(rowIndex);

    const questionCell = document.createElement('div');
    questionCell.className = 'html-scale-question-cell';
    questionCell.append(makeEditableText(slideNumber, `question-${rowIndex}`, 'html-scale-question-text', questionText.replace(/\n/g, '')));
    row.append(questionCell);

    page.scale.forEach((_, colIndex) => {
      const value = colIndex + 1;
      const choice = document.createElement('label');
      const input = document.createElement('input');
      const number = document.createElement('span');

      choice.className = 'html-scale-choice';
      input.type = 'radio';
      input.name = `scale-${answerKey}`;
      input.value = String(value);
      input.checked = scaleAnswers[answerKey] === String(value);
      input.addEventListener('change', () => {
        scaleAnswers[answerKey] = input.value;
        row.classList.remove('html-scale-row-unanswered');
        if (pendingWarningSlide === slideNumber) {
          const unansweredRows = getUnansweredRows(slideNumber);
          if (unansweredRows.length === 0) {
            hideValidationWarning();
          } else {
            renderValidationWarning(unansweredRows);
          }
        }
      });
      number.textContent = String(value);
      choice.append(input, number);
      row.append(choice);
    });

    table.append(row);
  });

  const footer = document.createElement('div');
  footer.className = 'html-question-footer';
  const warning = document.createElement('div');
  warning.className = 'html-validation-message hidden';
  warning.textContent = '赤枠の問いはまだ回答されていませんが、先へ進んでもよろしいでしょうか？';
  const nextButton = document.createElement('button');
  nextButton.className = 'html-next-button';
  nextButton.type = 'button';
  nextButton.setAttribute('aria-label', '次のページへ進む');
  nextButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleAdvanceRequest();
  });
  footer.append(warning, nextButton);

  shell.append(header, table, footer);
  questionPageOverlay.append(shell);
}

function renderScaleControls() {
  const slideNumber = getCurrentSlideNumber();
  const layout = scaleLayouts[slideNumber];
  radioOverlay.replaceChildren();
  radioOverlay.classList.toggle('hidden', !layout || Boolean(editableQuestionPages[slideNumber]));

  if (!layout || editableQuestionPages[slideNumber]) {
    return;
  }

  layout.rows.forEach((top, rowIndex) => {
    layout.cols.forEach((left, colIndex) => {
      const value = colIndex + 1;
      const answerKey = `${slideNumber}-${rowIndex}`;
      const inputId = `scale-${answerKey}-${value}`;
      const label = document.createElement('label');
      const input = document.createElement('input');
      const text = document.createElement('span');

      label.className = 'scale-choice';
      label.style.left = `${left}%`;
      label.style.top = `${top}%`;

      input.type = 'radio';
      input.name = `scale-${answerKey}`;
      input.value = String(value);
      input.id = inputId;
      input.checked = scaleAnswers[answerKey] === String(value);
      input.addEventListener('change', () => {
        scaleAnswers[answerKey] = input.value;
        if (pendingWarningSlide === slideNumber) {
          const unansweredRows = getUnansweredRows(slideNumber);
          if (unansweredRows.length === 0) {
            hideValidationWarning();
          } else {
            renderValidationWarning(unansweredRows);
          }
        }
      });

      text.textContent = value;
      label.append(input, text);
      radioOverlay.append(label);
    });
  });
}

function renderImageNavigationHover(slideNumber) {
  const isArrow = [1, 7, 8, 12].includes(slideNumber);
  if (!isArrow && slideNumber !== 13) {
    return;
  }

  // Display-only overlays; clicks still use the existing slide-area handler.
  const region = isArrow
    ? { left: 1130 / 1280 * 100, top: 600 / 720 * 100, width: 85 / 1280 * 100, height: 56 / 720 * 100 }
    : { left: 1083 / 1280 * 100, top: 644 / 720 * 100, width: 155 / 1280 * 100, height: 50 / 720 * 100 };
  const overlay = document.createElement('div');
  overlay.className = isArrow ? 'image-next-arrow-hover' : 'image-confirm-hover';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.left = `${region.left}%`;
  overlay.style.top = `${region.top}%`;
  overlay.style.width = `${region.width}%`;
  overlay.style.height = `${region.height}%`;
  if (isArrow) {
    overlay.style.backgroundImage = `url("${slideImage.currentSrc || slideImage.src}")`;
    overlay.style.backgroundSize = `${10000 / region.width}% ${10000 / region.height}%`;
    overlay.style.backgroundPosition = `${region.left / (100 - region.width) * 100}% ${region.top / (100 - region.height) * 100}%`;
  }
  qualityOverlay.append(overlay);
  qualityOverlay.classList.remove('hidden');
}

function renderSlideLayers(slideNumber) {
  counter.textContent = `${currentIndex + 1} / ${slideFiles.length}`;
  progressBar.style.width = `${((currentIndex + 1) / slideFiles.length) * 100}%`;
  coverOverlay.classList.toggle('hidden', slideNumber !== 0);
  inputOverlay.classList.toggle('hidden', slideNumber !== 33);
  backOverlay.classList.toggle('hidden', slideNumber !== 9);
  finishOverlay.classList.toggle('hidden', slideNumber !== 34);
  renderPersonControls();
  renderQuestionPage();
  renderPhotoFrameEditor();
  renderSlideTextMasks();
  renderImageNavigationHover(slideNumber);
  scaleTableOverlay.replaceChildren();
  scaleTableOverlay.classList.add('hidden');
  renderScaleControls();
  hideValidationWarning();
  updateOverlayMetrics();
}

function updateSlide() {
  const slideNumber = getCurrentSlideNumber();
  const renderToken = ++slideRenderToken;
  let didComplete = false;

  const completeRender = () => {
    if (didComplete || renderToken !== slideRenderToken) {
      return;
    }

    didComplete = true;
    renderSlideLayers(slideNumber);
    requestAnimationFrame(() => {
      if (renderToken === slideRenderToken) {
        slideArea.classList.remove('slide-area-loading');
      }
    });
  };

  slideArea.classList.add('slide-area-loading');
  slideImage.addEventListener('load', completeRender, { once: true });
  slideImage.addEventListener('error', completeRender, { once: true });
  slideImage.src = getSlideSrc(slideNumber);
  slideImage.alt = `スライド ${slideNumber}`;

  if (slideImage.complete && slideImage.naturalWidth > 0) {
    completeRender();
  }

  return;
  slideImage.src = getSlideSrc(slideNumber);
  slideImage.alt = `スライド ${slideNumber}`;

  counter.textContent = `${currentIndex + 1} / ${slideFiles.length}`;
  progressBar.style.width = `${((currentIndex + 1) / slideFiles.length) * 100}%`;
  coverOverlay.classList.toggle('hidden', slideNumber !== 0);
  inputOverlay.classList.toggle('hidden', slideNumber !== 33);
  backOverlay.classList.toggle('hidden', slideNumber !== 9);
  finishOverlay.classList.toggle('hidden', slideNumber !== 34);
  renderPersonControls();
  renderQuestionPage();
  renderPhotoFrameEditor();
  renderSlideTextMasks();
  scaleTableOverlay.replaceChildren();
  scaleTableOverlay.classList.add('hidden');
  renderScaleControls();
  hideValidationWarning();
  updateOverlayMetrics();
}

function showNext() {
  if (currentIndex >= slideFiles.length - 1) {
    finishSite();
    return;
  }

  if (getCurrentSlideNumber() === 13) {
    finalizeCurrentCaseView();
  }

  currentIndex += 1;
  updateSlide();
}

function showPrevious() {
  if (getCurrentSlideNumber() === 13) {
    finalizeCurrentCaseView();
  }

  currentIndex = (currentIndex - 1 + slideFiles.length) % slideFiles.length;
  updateSlide();
}

function isForwardButtonPoint(event) {
  const rect = getRenderedSlideRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;

  if (x < 0 || x > 1 || y < 0 || y > 1) {
    return false;
  }

  if (getCurrentSlideNumber() === 13) {
    // Match the confirmation button's visible frame and hover region on p14.
    return x >= 1083 / 1280 && x <= 1238 / 1280
      && y >= 644 / 720 && y <= 694 / 720;
  }

  return x >= 0.875 && x <= 0.96 && y >= 0.82 && y <= 0.925;
}

slideArea.addEventListener('mousemove', (event) => {
  slideArea.classList.toggle('forward-button-hover', isForwardButtonPoint(event));
  const confirmOverlay = qualityOverlay.querySelector('.image-confirm-hover');
  const rect = confirmOverlay?.getBoundingClientRect();
  slideArea.classList.toggle('confirm-button-hover', Boolean(rect
    && event.clientX >= rect.left && event.clientX <= rect.right
    && event.clientY >= rect.top && event.clientY <= rect.bottom));
});

slideArea.addEventListener('mouseleave', () => {
  slideArea.classList.remove('forward-button-hover', 'confirm-button-hover');
});

slideArea.addEventListener('click', (event) => {
  const target = event.target;

  if (target instanceof HTMLElement && target.closest('.html-next-button, .slide33-next-button, .finish-button, .cover-next-button, .cover-quit-button')) {
    return;
  }

  if (currentIndex === slideFiles.length - 1) {
    return;
  }

  if (isForwardButtonPoint(event)) {
    handleAdvanceRequest();
  }
}, true);

radioOverlay.addEventListener('click', (event) => {
  event.stopPropagation();
});

personOverlay.addEventListener('click', (event) => {
  event.stopPropagation();
});

questionPageOverlay.addEventListener('click', (event) => {
  event.stopPropagation();
});

photoFrameOverlay.addEventListener('click', (event) => {
  event.stopPropagation();
});

coverOverlay.addEventListener('click', (event) => {
  event.stopPropagation();
});

slideArea.addEventListener('dragstart', (event) => {
  event.preventDefault();
});

backButton.addEventListener('click', (event) => {
  event.stopPropagation();
  showPrevious();
});

slide33NextButton.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  handleAdvanceRequest();
});

[genderInput, ageInput].forEach((input) => {
  input.addEventListener('input', () => {
    if (input.value.trim() !== '') {
      input.classList.remove('inline-input-unanswered');
    }
  });
});

coverNextButton.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  recordSurveyStart();
  showNext();
});

coverQuitButton.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  finishSite({ closeWindow: false });
});

finishButton.addEventListener('click', async (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (surveySubmitting) {
    return;
  }

  try {
    surveySubmitting = true;
    finishButton.disabled = true;
    await submitSurveyToGoogleForm();
  } finally {
    surveySubmitting = false;
    finishButton.disabled = false;
    finishSite({ closeWindow: false });
  }
});

function finishSite({ closeWindow = true } = {}) {
  document.body.classList.add('site-finished');
  if (closeWindow) {
    window.close();
  }
}

slideImage.addEventListener('load', updateOverlayMetrics);
window.addEventListener('resize', updateOverlayMetrics);

updateSlide();

async function submitSurveyToGoogleForm() {
  if (surveySubmitted) {
    return;
  }

  if (startedAt === null || participantId === null) {
    recordSurveyStart();
  }

  finalizeCurrentCaseView();

  const formData = new FormData();
  const buttonOrder = caseViewEvents.map((event) => event.case).join(" | ");
  const buttonViewTimes = caseViewEvents.map((event) => event.time).join(" | ");

  formData.append("entry.2073436287", startedAt);
  formData.append("entry.667652200", participantId);
  formData.append("entry.1325903696", genderInput.value);
  formData.append("entry.321566609", ageInput.value);
  formData.append("entry.945682249", isTest);

  answerEntryMappings.forEach(([answerKey, entryId]) => {
    formData.append(entryId, scaleAnswers[answerKey] ?? "");
  });

  formData.append("entry.1548578805", buttonOrder);
  formData.append("entry.216872327", buttonViewTimes);

  caseTotalEntryMappings.forEach(([caseId, entryId]) => {
    formData.append(entryId, String(caseViewTotals[caseId] ?? 0));
  });

  console.log("アンケートデータ送信", {
    startedAt,
    participantId,
    gender: genderInput.value,
    age: ageInput.value,
    answers: scaleAnswers,
    buttonOrder,
    buttonViewTimes,
    caseViewTotals
  });

  try {
    await fetch(
      "https://docs.google.com/forms/d/e/1FAIpQLSchB9nmlY__QcMBZkckOcxX20OEl3zY1hKIsworZuuCrdnlRA/formResponse",
      {
        method: "POST",
        mode: "no-cors",
        body: formData
      }
    );
    surveySubmitted = true;
  } catch (error) {
    console.error('アンケートデータのGoogleフォーム送信に失敗しました', error);
  }
}
