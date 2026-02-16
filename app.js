// ===== 시트 설정(이미 입력됨) =====
const SHEET_ID = "1E9z8-byVGtd_DaVyD99TqGpxpY8SKTPjoM_R4Gp1G6A";
const SHEET_NAME = "7일";

// gviz JSON endpoint
const GVIZ_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?` +
  `tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

const elList = document.getElementById("list");
const elEmpty = document.getElementById("empty");
const elUpdated = document.getElementById("updated");
const elViewMode = document.getElementById("viewMode");
const elStatus = document.getElementById("statusFilter");
const elQ = document.getElementById("q");

let rows = [];

function parseGviz(text){
  const jsonText = text
    .replace(/^[\s\S]*setResponse\(/, "")
    .replace(/\);\s*$/, "");
  return JSON.parse(jsonText);
}

function cell(v){
  if (v == null) return "";
  if (typeof v === "object" && "f" in v && v.f) return String(v.f);
  if (typeof v === "object" && "v" in v) return String(v.v ?? "");
  return String(v);
}

function normalizeRow(r){
  const c = r.c || [];
  return {
    date: cell(c[0]),
    day: cell(c[1]),
    start: cell(c[2]),
    end: cell(c[3]),
    content: cell(c[4]),
    detail: cell(c[5]),
    status: cell(c[6]),
    tags: cell(c[7]),
  };
}

function toDateKey(s){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s||"").trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function withinWeek(d){
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function render(){
  const mode = elViewMode.value;
  const status = elStatus.value.trim();
  const q = elQ.value.trim().toLowerCase();

  let filtered = rows.slice();

  if (mode === "week"){
    filtered = filtered.filter(x => {
      const d = toDateKey(x.date);
      if (!d) return true;
      return withinWeek(d);
    });
  }
  if (status){
    filtered = filtered.filter(x => (x.status || "").trim() === status);
  }
  if (q){
    filtered = filtered.filter(x => {
      const blob = `${x.date} ${x.day} ${x.start} ${x.end} ${x.content} ${x.detail} ${x.status} ${x.tags}`.toLowerCase();
      return blob.includes(q);
    });
  }

  filtered.sort((a,b)=>{
    const da = toDateKey(a.date)?.getTime() ?? 0;
    const db = toDateKey(b.date)?.getTime() ?? 0;
    if (da !== db) return da - db;
    return (a.start || "").localeCompare(b.start || "");
  });

  elList.innerHTML = "";
  if (filtered.length === 0){
    elEmpty.classList.remove("hidden");
    return;
  }
  elEmpty.classList.add("hidden");

  for (const x of filtered){
    const tags = (x.tags || "").split(/[\s,]+/).map(t=>t.trim()).filter(Boolean);
    const statusClass = x.status ? `status-${x.status.trim()}` : "";
    const timeText = x.end ? `${x.start} ~ ${x.end}` : (x.start || "");

    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <div class="timeBox">
        <div class="date">${escapeHtml(x.date)} ${escapeHtml(x.day)}</div>
        <div class="time">${escapeHtml(timeText)}</div>
      </div>
      <div>
        <div class="badgeRow">
          ${x.status ? `<span class="badge ${statusClass}">${escapeHtml(x.status)}</span>` : ""}
          ${x.content ? `<span class="badge">🎮 ${escapeHtml(x.content)}</span>` : ""}
        </div>
        <div class="title">${escapeHtml(x.content || "일정")}</div>
        ${x.detail ? `<div class="desc">${escapeHtml(x.detail)}</div>` : ""}
        ${tags.length ? `<div class="tags">${tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
      </div>
    `;
    elList.appendChild(item);
  }
}

async function load(){
  elUpdated.textContent = "불러오는 중…";
  try{
    const res = await fetch(GVIZ_URL, { cache: "no-store" });
    const text = await res.text();
    const data = parseGviz(text);

    const t = data.table;
    const rawRows = (t.rows || []).map(normalizeRow);
    rows = rawRows.filter(r => ((r.content || r.date || r.start) + "").trim() !== "");

    const now = new Date();
    elUpdated.textContent = `업데이트: ${now.toLocaleString("ko-KR")}`;
    render();
  }catch(e){
    elUpdated.textContent = "불러오기 실패: 시트 공개/웹게시/탭이름 확인!";
    console.error(e);
  }
}

elViewMode.addEventListener("change", render);
elStatus.addEventListener("change", render);
elQ.addEventListener("input", render);

load();

// ===== JPG 다운로드 =====
document.getElementById("downloadJpg").addEventListener("click", async () => {
  const target = document.querySelector(".wrap");
  try {
    const canvas = await html2canvas(target, {
      backgroundColor: "#070912",
      scale: 2,
      useCORS: true
    });
    const link = document.createElement("a");
    link.download = "vell_luna_schedule.jpg";
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  } catch (e) {
    alert("이미지 생성 실패! (브라우저 콘솔 확인)");
    console.error(e);
  }
});
