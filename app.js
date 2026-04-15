/**
 * car-parking-app/app.js
 * 차량 주차 위치 저장 앱 — 프론트엔드 전용 (localStorage)
 * 저장 키: carParkingInfoV1
 */

'use strict';

const STORAGE_KEY = 'carParkingInfoV1';

// 층 코드 → 한국어 표시명
const FLOOR_LABEL = {
  B1: '지하 1층',
  B2: '지하 2층',
  B3: '지하 3층',
  B4: '지하 4층',
};

// DOM 레퍼런스
const els = {
  car1Floor:   () => document.getElementById('car1-floor'),
  car2Floor:   () => document.getElementById('car2-floor'),
  car1Result:  () => document.getElementById('car1-result'),
  car2Result:  () => document.getElementById('car2-result'),
  savedAt:     () => document.getElementById('saved-at'),
  saveBtn:     () => document.getElementById('save-btn'),
  clearBtn:    () => document.getElementById('clear-btn'),
  feedback:    () => document.getElementById('save-feedback'),
};

/** localStorage에서 데이터 읽기 */
function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** localStorage에 데이터 쓰기 */
function writeStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** 저장 시각을 사용자 친화적 문자열로 변환 */
function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d)) return '—';
  return d.toLocaleString('ko-KR', {
    year:   'numeric',
    month:  '2-digit',
    day:    '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** 결과 박스 렌더링 */
function renderResult(boxEl, floorCode, carName) {
  if (!floorCode) {
    boxEl.classList.add('empty');
    boxEl.innerHTML = `
      <span class="result-label">${carName}</span>
      <span class="result-value">—</span>
      <span class="result-sub">저장된 위치 없음</span>
    `;
    return;
  }

  boxEl.classList.remove('empty');
  boxEl.innerHTML = `
    <span class="result-label">${carName}</span>
    <span class="result-value">${floorCode}</span>
    <span class="result-sub">${FLOOR_LABEL[floorCode] ?? floorCode}</span>
  `;
}

/** 저장된 데이터를 UI에 반영 */
function applyData(data) {
  const car1 = data?.car1 ?? '';
  const car2 = data?.car2 ?? '';

  // 셀렉트 복원
  if (car1) els.car1Floor().value = car1;
  if (car2) els.car2Floor().value = car2;

  // 결과 박스
  renderResult(els.car1Result(), car1, '펠리세이드');
  renderResult(els.car2Result(), car2, '레이');

  // 저장 시각
  els.savedAt().textContent = formatDate(data?.savedAt);
}

/** 초기 상태(저장 없음)로 UI 리셋 */
function resetUI() {
  els.car1Floor().value = '';
  els.car2Floor().value = '';
  renderResult(els.car1Result(), '', '펠리세이드');
  renderResult(els.car2Result(), '', '레이');
  els.savedAt().textContent = '—';
}

/** 완료 피드백 잠깐 보여주기 */
function showFeedback() {
  const fb = els.feedback();
  fb.classList.add('show');
  setTimeout(() => fb.classList.remove('show'), 2500);
}

/* ── 이벤트 핸들러 ── */

function onSave() {
  const car1 = els.car1Floor().value;
  const car2 = els.car2Floor().value;

  const data = {
    car1: car1,
    car2: car2,
    savedAt: new Date().toISOString(),
  };

  writeStorage(data);
  applyData(data);
  showFeedback();
}

function onClear() {
  if (!confirm('저장된 주차 정보를 모두 삭제하시겠습니까?')) return;
  localStorage.removeItem(STORAGE_KEY);
  resetUI();
}

/* ── 초기화 ── */

function loadData() {
  const data = readStorage();
  if (data) {
    applyData(data);
  } else {
    resetUI();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  els.saveBtn().addEventListener('click', onSave);
  els.clearBtn().addEventListener('click', onClear);
});
