// ===== 시트 설정 =====
const SHEET_ID = "1E9z8-byVGtd_DaVyD99TqGpxpY8SKTPjoM_R4Gp1G6A";
const SHEET_NAME = "7일";

const GVIZ_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

const elList = document.getElementById("list");
const elUpdated = document.getElementById("updated");
const elViewMode = document.getElementById("viewMode");
const elStatus = document.getElementById("statusFilter");
const elQ = document.getElementById("q");

let rows = [];

function parseGviz(text){
  const jsonText = text.replace(/^[\s\S]*setResponse\(/, "").replace(/\);\s*$/, "");
  return JSON.parse(jsonText);
}

function cell(v){
  if (!v) return "";
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

function render(){
  elList.innerHTML = "";
  for (const x of rows){
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = `${x.date} ${x.start} ${x.content}`;
    elList.appendChild(div);
  }
}

async function load(){
  try{
    const res = await fetch(GVIZ_URL);
    const text = await res.text();
    const data = parseGviz(text);
    rows = (data.table.rows || []).map(normalizeRow);
    elUpdated.textContent = "업데이트 완료";
    render();
  }catch(e){
    elUpdated.textContent = "불러오기 실패";
  }
}
load();

// ===== JPG 다운로드 =====
document.getElementById("downloadJpg").addEventListener("click", async () => {
  const target = document.querySelector(".wrap");
  const canvas = await html2canvas(target, {
    backgroundColor: "#070912",
    scale: 2,
    useCORS: true
  });
  const link = document.createElement("a");
  link.download = "vell_luna_schedule.jpg";
  link.href = canvas.toDataURL("image/jpeg", 0.95);
  link.click();
});
