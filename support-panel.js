(() => {
const SB_URL="https://jfixjlygjukrlokdznhh.supabase.co";
const SB_KEY="sb_publishable_JpVcwEzZzpPcDwj9PhkZHQ_AoKpw9Kt";
const sb=supabase.createClient(SB_URL,SB_KEY);
const cfg=window.SUPPORT_STAFF;
const $=id=>document.getElementById(id);
let session=null, profile=null, drivers=[];
const digits=s=>(s||"").toString().replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^0-9]/g,"");
const say=(s,bad=false)=>{ const id=$("appView").hidden?"loginMsg":"appMsg"; $(id).textContent=s; $(id).className=bad?"msg bad":"msg"; };
function authEmail(u){return u+"@staff.adl.local";}
function statusLabel(s){return s==="issued"?"صادر شده":s==="cancelled"?"لغو شده":"در انتظار بررسی";}
async function init(){
 $("staffTitle").textContent=cfg.name;
 $("loginUser").value=cfg.username;
 const {data:{session:s}}=await sb.auth.getSession();
 if(s){session=s;await enterApp();}
 sb.auth.onAuthStateChange((_e,s)=>{session=s;if(!s)showLogin();});
}
function showLogin(){$("loginView").hidden=false;$("appView").hidden=true;}
async function login(){
 const u=$("loginUser").value.trim().toLowerCase(), p=$("loginPass").value;
 if(u!==cfg.username)return say("این صفحه مخصوص "+cfg.name+" است.",true);
 if(!p)return say("رمز عبور را وارد کنید.",true);
 $("loginBtn").disabled=true;say("در حال ورود...");
 const {data,error}=await sb.auth.signInWithPassword({email:authEmail(cfg.username),password:p});
 $("loginBtn").disabled=false;
 if(error)return say("ورود انجام نشد؛ نام کاربری/رمز یا فعال‌سازی حساب را بررسی کنید.",true);
 session=data.session;await enterApp();
}
async function enterApp(){
 const {data:p,error}=await sb.from("support_staff").select("staff_name,username,role,active").eq("user_id",session.user.id).maybeSingle();
 if(error||!p||!p.active||p.role!=="support"||p.username!==cfg.username){await sb.auth.signOut();return say("این حساب برای این پنل مجاز نیست.",true);}
 profile=p;$("loginView").hidden=true;$("appView").hidden=false;
 $("who").textContent=p.staff_name;
 await Promise.all([loadDrivers(),loadMine()]);
}
async function loadDrivers(){
 const {data,error}=await sb.from("waybill_drivers").select("national,name,license,mobile,plate,vehicle").order("name").limit(10000);
 if(!error)drivers=data||[];
}
function syncPlate(){
 const a=digits($("plateLeft").value).slice(0,2), b=digits($("plateThree").value).slice(0,3), l=$("plateLetter").value, c=digits($("plateRight").value).slice(0,2);
 $("plate").value=(a||b||l||c)?[a,b,l,c].filter(Boolean).join(" "):"";
}
function setPlate(value){
 const raw=String(value||""); const ds=digits(raw); const letter=(raw.match(/[آ-ی]/)||[])[0]||"";
 $("plateLeft").value=ds.slice(0,2); $("plateThree").value=ds.slice(2,5); $("plateLetter").value=letter; $("plateRight").value=ds.slice(5,7); syncPlate();
}
function fillDriver(d){
 if(!d)return;
 $("national").value=d.national||$("national").value;
 $("driverName").value=d.name||"";
 $("license").value=d.license||"";
 $("mobile").value=d.mobile||"";
 $("plate").value=d.plate||"";setPlate(d.plate||"");
 $("vehicle").value=d.vehicle||"";
 say("اطلاعات راننده از بانک اطلاعاتی پیدا شد.");
}
function lookup(){
 const n=digits($("national").value);
 if(!n)return say("کد ملی را وارد کنید.",true);
 const d=drivers.find(x=>digits(x.national)===n);
 if(d)return fillDriver(d);
 say("راننده با این کد ملی پیدا نشد؛ اطلاعات را دستی وارد کنید.",true);
}
function lookupPlate(){
 syncPlate(); const p=digits($("plate").value);
 if(!p)return say("شماره پلاک را وارد کنید.",true);
 const d=drivers.find(x=>digits(x.plate)===p);
 if(d)return fillDriver(d);
 say("پلاکی با این مشخصات پیدا نشد؛ اطلاعات را دستی وارد کنید.",true);
}
function formData(){syncPlate();return {
 submitted_by:session.user.id,staff_name:profile.staff_name,
 issue_date:$("issueDate").value||new Date().toISOString().slice(0,10),
 national:$("national").value.trim(),name:$("driverName").value.trim(),
 license:$("license").value.trim(),mobile:$("mobile").value.trim(),plate:$("plate").value.trim(),
 vehicle:$("vehicle").value.trim(),cargo:$("cargo").value.trim(),
 origin:$("origin").value.trim()||"تهران",dest:$("dest").value.trim(),
 dest_phone:$("destPhone").value.trim()||null,notes:$("notes").value.trim()||null
};}
async function submitRequest(){
 const d=formData();
 if(!d.national||!d.name||!d.cargo||!d.dest)return say("کد ملی، نام راننده، نوع بار و مقصد الزامی است.",true);
 $("sendBtn").disabled=true;say("در حال ارسال اطلاعات...");
 const {error}=await sb.from("support_submissions").insert(d);
 $("sendBtn").disabled=false;
 if(error)return say("ارسال انجام نشد. اتصال و ورود حساب را بررسی کنید.",true);
 say("اطلاعات با موفقیت برای پنل اصلی ارسال شد.");
 $("notes").value="";await loadMine();
}
async function loadMine(){
 const {data,error}=await sb.from("support_submissions").select("*").eq("submitted_by",session.user.id).order("submitted_at",{ascending:false}).limit(300);
 if(error)return say("دریافت سوابق انجام نشد.",true);
 const term=$("filter").value.trim().toLowerCase(), state=$("statusFilter").value;
 const rows=(data||[]).filter(x=>(!state||x.status===state)&&(!term||[x.name,x.national,x.plate,x.cargo,x.dest].some(v=>(v||"").toLowerCase().includes(term))));
 $("rows").innerHTML=rows.length?rows.map(x=>'<tr><td>'+esc(x.submitted_at?new Date(x.submitted_at).toLocaleString("fa-IR"):"")+'</td><td>'+esc(x.name)+'</td><td>'+esc(x.national)+'</td><td>'+esc(x.plate||"—")+'</td><td>'+esc(x.cargo)+'</td><td>'+esc(x.dest)+'</td><td>'+esc(statusLabel(x.status))+'</td><td>'+esc(x.notes||"—")+'</td></tr>').join(""):'<tr><td colspan="8" class="empty">موردی ثبت نشده است.</td></tr>';
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function exportCsv(){
 const table=$("rows");const rows=[...table.querySelectorAll("tr")].map(tr=>[...tr.querySelectorAll("th,td")].map(td=>td.innerText));
 const csv="\uFEFF"+rows.map(r=>r.map(v=>'"'+v.replace(/"/g,'""')+'"').join(",")).join("\r\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));a.download=cfg.username+"-requests.csv";a.click();URL.revokeObjectURL(a.href);
}
async function logout(){await sb.auth.signOut();showLogin();}
function resetForm(){$("requestForm").reset();$("issueDate").value=new Date().toISOString().slice(0,10);say("");}
window.addEventListener("DOMContentLoaded",()=>{
 $("loginBtn").addEventListener("click",login);$("logoutBtn").addEventListener("click",logout);
 $("lookupBtn").addEventListener("click",lookup);$("plateBtn").addEventListener("click",lookupPlate);
 $("sendBtn").addEventListener("click",submitRequest);$("refreshBtn").addEventListener("click",loadMine);
 $("filter").addEventListener("input",loadMine);$("statusFilter").addEventListener("change",loadMine);
 $("exportBtn").addEventListener("click",exportCsv);$("clearBtn").addEventListener("click",resetForm);
 ["plateLeft","plateThree","plateRight"].forEach(id=>$(id).addEventListener("input",()=>{const max=id==="plateThree"?3:2;$(id).value=digits($(id).value).slice(0,max);syncPlate();}));
 $("plateLetter").addEventListener("change",syncPlate);
 $("plate").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();lookupPlate();}});
 $("national").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();lookup();}});
 $("issueDate").value=new Date().toISOString().slice(0,10);init();
});
})();