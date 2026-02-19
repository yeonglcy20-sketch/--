const SHEET_ID = "1E9z8-byVGtd_DaVyD99TqGpxpY8SKTPjoM_R4Gp1G6A";
const SHEET_NAME = "7일";

const GVIZ_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

const elList = document.getElementById("list");
const elUpdated = document.getElementById("updated");

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
  return { date: cell(c[0]), start: cell(c[2]), content: cell(c[4]) };
}
async function load(){
  try{
    const res = await fetch(GVIZ_URL);
    const text = await res.text();
    const data = parseGviz(text);
    const rows = (data.table.rows || []).map(normalizeRow);
    elList.innerHTML = rows.map(r=>`<div class="item">${r.date} ${r.start} ${r.content}</div>`).join("");
    elUpdated.textContent = "업데이트 완료";
  }catch(e){
    elUpdated.textContent = "불러오기 실패";
  }
}
load();

document.getElementById("downloadJpg").addEventListener("click", async () => {
  const target = document.querySelector(".wrap");
  const canvas = await html2canvas(target,{backgroundColor:"#070912",scale:2,useCORS:true});
  const link=document.createElement("a");
  link.download="luna_vell_schedule.jpg";
  link.href=canvas.toDataURL("image/jpeg",0.95);
  link.click();
});
