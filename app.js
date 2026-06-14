/**
 * car-parking-app/app.js
 * 차량 주차 위치 저장 앱 — 프론트엔드 전용 (localStorage)
 * 저장 키: carParkingInfoV1 (집 주차), extParkingInfoV1 (외부 주차)
 */

'use strict';

const STORAGE_KEY     = 'carParkingInfoV1';
const EXT_STORAGE_KEY = 'extParkingInfoV1';

// 층 코드 → 한국어 표시명 (집 주차)
const FLOOR_LABEL = {
  B1: '지하 1층',
  B2: '지하 2층',
  B3: '지하 3층',
  B4: '지하 4층',
};

// 외부 주차 층 옵션 (지하/지상)
const EXT_FLOOR_UNDERGROUND = [
  { value: 'B1', label: 'B1 — 지하 1층' },
  { value: 'B2', label: 'B2 — 지하 2층' },
  { value: 'B3', label: 'B3 — 지하 3층' },
  { value: 'B4', label: 'B4 — 지하 4층' },
  { value: 'B5', label: 'B5 — 지하 5층' },
  { value: 'B6', label: 'B6 — 지하 6층' },
  { value: 'B7', label: 'B7 — 지하 7층' },
];

const EXT_FLOOR_GROUND = [
  { value: 'G1', label: 'G1 — 지상 1층' },
  { value: 'G2', label: 'G2 — 지상 2층' },
  { value: 'G3', label: 'G3 — 지상 3층' },
  { value: 'G4', label: 'G4 — 지상 4층' },
  { value: 'G5', label: 'G5 — 지상 5층' },
  { value: 'G6', label: 'G6 — 지상 6층' },
  { value: 'G7', label: 'G7 — 지상 7층' },
];

// 층 코드 → 한국어 레이블 (외부)
function extFloorLabel(code) {
  const allOptions = [...EXT_FLOOR_UNDERGROUND, ...EXT_FLOOR_GROUND];
  const found = allOptions.find(o => o.value === code);
  return found ? found.label.split(' — ')[1] : code;
}

// ── DOM refs ──
const $ = id => document.getElementById(id);

/* ════════════════ 탭 전환 ════════════════ */
function switchTab(tab) {
  $('panel-home').style.display = tab === 'home' ? '' : 'none';
  $('panel-ext').style.display  = tab === 'ext'  ? '' : 'none';
  $('tab-home').classList.toggle('active', tab === 'home');
  $('tab-ext').classList.toggle('active',  tab === 'ext');
}

/* ════════════════ 공통 유틸 ════════════════ */
function readStorage(key) {
  try { return JSON.parse(localStorage.getItem(key)) || null; }
  catch { return null; }
}

function writeStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d)) return '—';
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

const feedbackTimers = {};
function showFeedback(id) {
  const fb = $(id);
  fb.classList.add('show');
  clearTimeout(feedbackTimers[id]);
  feedbackTimers[id] = setTimeout(() => fb.classList.remove('show'), 2500);
}

/* ════════════════ 집 주차 ════════════════ */
function renderHomeResult(boxEl, floorCode, carName) {
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

function applyHomeData(data) {
  const car1 = data?.car1 ?? '';
  const car2 = data?.car2 ?? '';
  $('car1-floor').value = car1;
  $('car2-floor').value = car2;
  renderHomeResult($('car1-result'), car1, '펠리세이드');
  renderHomeResult($('car2-result'), car2, '레이');
  $('saved-at').textContent = formatDate(data?.savedAt);
}

function resetHomeUI() {
  $('car1-floor').value = '';
  $('car2-floor').value = '';
  renderHomeResult($('car1-result'), '', '펠리세이드');
  renderHomeResult($('car2-result'), '', '레이');
  $('saved-at').textContent = '—';
}

function onHomeSave() {
  const car1 = $('car1-floor').value;
  const car2 = $('car2-floor').value;

  if (!car1 && !car2) {
    alert('저장할 주차 층을 한 곳 이상 선택해 주세요.');
    return;
  }

  const data = {
    car1,
    car2,
    savedAt: new Date().toISOString(),
  };
  writeStorage(STORAGE_KEY, data);
  applyHomeData(data);
  showFeedback('save-feedback');
}

function onHomeClear() {
  if (!confirm('저장된 집 주차 정보를 모두 삭제하시겠습니까?')) return;
  localStorage.removeItem(STORAGE_KEY);
  resetHomeUI();
}

/* ════════════════ 외부 주차 ════════════════ */
function buildExtFloorOptions(isGround, selectedValue) {
  const options = isGround ? EXT_FLOOR_GROUND : EXT_FLOOR_UNDERGROUND;
  const sel = $('ext-floor');
  sel.innerHTML = '<option value="">층 선택</option>';
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === selectedValue) opt.selected = true;
    sel.appendChild(opt);
  });
}

function applyExtData(data) {
  const isGround = data?.isGround ?? false;
  $('ext-ground-check').checked = isGround;
  buildExtFloorOptions(isGround, data?.floor ?? '');
  $('ext-pillar').value = data?.pillar ?? '';
  renderExtResult(data?.floor ?? '', data?.pillar ?? '', isGround);
  $('ext-saved-at').textContent = formatDate(data?.savedAt);
}

function renderExtResult(floor, pillar, isGround) {
  const box = $('ext-result');
  const hasData = floor || pillar;
  box.classList.toggle('empty', !hasData);

  $('ext-result-floor').textContent = floor || '—';
  $('ext-result-floor-sub').textContent = floor ? extFloorLabel(floor) : '저장된 층 없음';
  $('ext-result-pillar').textContent = pillar || '—';
  $('ext-result-pillar-sub').textContent = pillar ? (floor ? extFloorLabel(floor) + ' · ' + pillar + '번 기둥' : pillar + '번 기둥') : '저장된 기둥 없음';
}

function resetExtUI() {
  $('ext-ground-check').checked = false;
  buildExtFloorOptions(false, '');
  $('ext-pillar').value = '';
  renderExtResult('', '', false);
  $('ext-saved-at').textContent = '—';
}

function onExtSave() {
  const floor   = $('ext-floor').value;
  const pillar  = $('ext-pillar').value.trim().toUpperCase();
  const isGround = $('ext-ground-check').checked;

  if (!floor && !pillar) {
    alert('저장할 주차 층 또는 기둥 번호를 입력해 주세요.');
    return;
  }

  const data = { floor, pillar, isGround, savedAt: new Date().toISOString() };
  writeStorage(EXT_STORAGE_KEY, data);
  applyExtData(data);
  showFeedback('ext-save-feedback');
}

function onExtClear() {
  if (!confirm('저장된 외부 주차 정보를 삭제하시겠습니까?')) return;
  localStorage.removeItem(EXT_STORAGE_KEY);
  resetExtUI();
}

/* ════════════════ 초기화 ════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // 집 주차 데이터 로드
  const homeData = readStorage(STORAGE_KEY);
  homeData ? applyHomeData(homeData) : resetHomeUI();

  // 외부 주차 데이터 로드
  const extData = readStorage(EXT_STORAGE_KEY);
  extData ? applyExtData(extData) : resetExtUI();

  // 집 주차 이벤트
  $('save-btn').addEventListener('click', onHomeSave);
  $('clear-btn').addEventListener('click', onHomeClear);

  // 외부 주차 이벤트
  $('ext-save-btn').addEventListener('click', onExtSave);
  $('ext-clear-btn').addEventListener('click', onExtClear);

  // 지상 토글
  $('ext-ground-check').addEventListener('change', () => {
    const isGround = $('ext-ground-check').checked;
    buildExtFloorOptions(isGround, '');
  });

  // 탭 전환은 HTML onclick으로 처리 (switchTab 전역 함수)
});
