let FB=null,fb=null;
try{FB=await import('./fb.js');fb=FB.init((await import('./firebase-config.js')).default)}catch(e){console.warn('Firebase unavailable',e)}
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID(),r3=x=>Math.round(x*1000)/1000,pad=n=>String(n).padStart(4,'0');
const norm=s=>String(s||'').toLowerCase().replace(/[\u064B-\u065F\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[٠-٩]/g,d=>d.charCodeAt(0)-1632);
const num=s=>r3(parseFloat(norm(s).replace(/[٫,]/g,'.'))||0);
/* ---- IndexedDB ---- */
const DB=new Promise((ok,no)=>{const r=indexedDB.open('dispatcher',1);r.onupgradeneeded=()=>['customers','items','orders','notes','meta'].forEach(n=>r.result.createObjectStore(n,{keyPath:n=='meta'?'k':'id'}));r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const all=async n=>{const d=await DB;return new Promise((ok,no)=>{const q=d.transaction(n).objectStore(n).getAll();q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})};
const run=async(names,fn)=>{const d=await DB;return new Promise((ok,no)=>{const t=d.transaction(names,'readwrite');fn(n=>t.objectStore(n));t.oncomplete=ok;t.onerror=t.onabort=()=>no(t.error)})};
const save=(n,rec,mk)=>run(mk?[n,'meta']:[n],o=>{o(n).put(rec);if(mk)o('meta').put({k:mk,v:S.meta[mk]})});
const upsert=(a,r)=>{const i=a.findIndex(x=>x.id==r.id);i<0?a.push(r):a[i]=r};
const S={customers:[],items:[],orders:[],notes:[],meta:{ord:0,dn:0}};
async function load(){for(const k of['customers','items','orders','notes'])S[k]=await all(k);for(const r of await all('meta'))S.meta[r.k]=r.v}
const wd=s=>String(s??'').replace(/[٠-٩]/g,d=>d.charCodeAt(0)-1632).replace(/[۰-۹]/g,d=>d.charCodeAt(0)-1776);
const ST={all:'All',pending:'Pending',partial:'Partially Fulfilled',fulfilled:'Fulfilled',closed:'Closed'};
const TK='dispatcher-theme';
const getTheme=()=>{try{const v=localStorage.getItem(TK);return v=='light'||v=='dark'?v:'system'}catch(e){return'system'}};
let THEME=getTheme();
const applyTheme=t=>{const c=document.documentElement.classList;c.remove('theme-light','theme-dark');if(t!='system')c.add('theme-'+t)};
const setTheme=t=>{THEME=t;try{t=='system'?localStorage.removeItem(TK):localStorage.setItem(TK,t)}catch(e){}applyTheme(t)};
applyTheme(THEME);
const NS={all:'All',loading:'Loading',dispatched:'Dispatched',delivered:'Delivered'};
const fdt=i=>new Intl.DateTimeFormat('en-GB-u-nu-latn',{dateStyle:'medium',timeStyle:'short'}).format(new Date(i));
const nm=x=>wd(x.name),cn=o=>nm(o.cust);
const cleanAddrs=a=>{const out=[],seen=new Set;for(const x of Array.isArray(a)?a:(typeof a=='string'&&a.trim()?[a]:[])){const t=wd(x).replace(/\s+/g,' ').trim(),k=norm(t);if(t&&!seen.has(k)){seen.add(k);out.push(t)}}return out};
const mergeA=(id,ad)=>ad===undefined?[...(S.customers.find(x=>x.id==id)?.addresses||[])]:cleanAddrs(ad);
const cleanPh=a=>{const out=[],seen=new Set;for(const x of Array.isArray(a)?a:(typeof a=='string'&&a.trim()?[a]:[])){const t=wd(x).replace(/\s+/g,' ').trim(),k=t.replace(/[^\d+]/g,'')||t;if(t&&!seen.has(k)){seen.add(k);out.push(t)}}return out};
const phOf=c=>c?(Array.isArray(c.phones)?c.phones:cleanPh(c.phone)):[];
const phRow=(l,tap)=>l.length?`<div class="phs">${l.map(p=>{const t=String(p).replace(/[^\d+]/g,'');return tap&&t?`<a class="ph" href="tel:${esc(t)}" dir="ltr">${esc(p)}</a>`:`<span class="ph" dir="ltr">${esc(p)}</span>`}).join('')}</div>`:'';
const ordPh=(o,tap)=>phRow(o?.cust?.phones??phOf(S.customers.find(x=>x.id==o?.cust?.id)),tap);
const libPh=v=>{let d=wd(v).replace(/[\s\-().]/g,'');const m=d.match(/^(?:\+|00)?218(9\d{8})$/);if(m)d='0'+m[1];return /^09\d{8}$/.test(d)?d:null};
const phMsg=p=>(p?`"${p}" is not a valid phone number.`:'Please enter a phone number.')+' Use a Libyan mobile number of 10 digits starting with 09, for example 0912345678.';
const warn=msg=>new Promise(r=>{const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="box" role="alertdialog" aria-modal="true"><p>${esc(msg)}</p><div class="bt"><button data-v="1">OK</button></div></div>`;m.onclick=e=>{if(e.target.dataset?.v!=null||e.target==m){m.remove();r()}};document.body.append(m);$('[data-v="1"]',m).focus()});
const akey=a=>norm(wd(a).replace(/\s+/g,' ').trim());
const lu=(arr,k)=>(arr||[]).find(l=>akey(l.a)==k)?.u||'';
const lnkOf=(c,a)=>{const k=akey(a);return k?lu(c?.links,k):''};
const ordLink=o=>o?.address?(o.mapUrl??lnkOf(S.customers.find(x=>x.id==o.cust?.id),o.address)):'';
function mapLink(v){v=String(v||'').trim();const t=v.split(/\s/)[0];let u=(v.match(/https?:\/\/[^\s<>"']+/i)||[])[0]||(/^(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)/i.test(t)?'https://'+t:'');if(!u)return null;let x;try{x=new URL(u)}catch(e){return null}
 if(x.protocol=='http:')x.protocol='https:';const h=x.hostname.toLowerCase(),p=x.pathname;
 const ok=h=='maps.app.goo.gl'||(h=='goo.gl'&&p.startsWith('/maps'))||/^maps\.google\.[a-z.]+$/.test(h)||(/^(www\.)?google\.[a-z.]+$/.test(h)&&p.startsWith('/maps'));return x.protocol=='https:'&&ok?x.href:null}
const cleanLinks=a=>(Array.isArray(a)?a:[]).map(l=>({a:wd(l?.a).replace(/\s+/g,' ').trim(),u:mapLink(l?.u)})).filter(l=>l.a&&l.u);
const mergeL=(id,l)=>l===undefined?[...(S.customers.find(x=>x.id==id)?.links||[])]:cleanLinks(l);
const MAPMSG="That doesn't look like a Google Maps link. In Google Maps, tap Share, copy the link and paste it here.";
const mapBtn=(a,i,empty)=>`<button class="mapbtn" data-a="${a}"${i!=null?` data-i="${i}"`:''} aria-label="${empty?'Add Google Maps link':'Open in Google Maps'}"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="#EA4335" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.8" fill="#fff"/></svg>${empty?'<i class="mpl" aria-hidden="true">+</i>':''}</button>`;
const openMap=u=>{const w=window.open(u,'_blank');if(w){try{w.opener=null}catch(e){}}else location.href=u};
function linkInput(has){return new Promise(r=>{const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="box" role="dialog" aria-modal="true"><p><b>${has?'Update Google Maps link':'Add Google Maps link'}</b></p>${has?'<small class="hint" style="margin:-4px 2px 8px">A link is already saved. Paste a new one to replace it.</small>':''}<input class="pi" type="url" inputmode="url" dir="ltr" placeholder="Paste Google Maps link" autocomplete="off"><small class="hint">In Google Maps, tap Share, then Copy link.</small><div class="bt" style="margin-top:12px;flex-wrap:wrap">${has?'<button data-m="r" class="danger">Remove link</button>':''}<button data-m="0">Cancel</button><button data-m="1">Save</button></div></div>`;
 const inp=$('input',m),save=async()=>{const u=mapLink(inp.value);if(!u){await warn(MAPMSG);inp.focus();return}m.remove();r({url:u})};
 m.onclick=e=>{const v=e.target.dataset?.m;if(v=='1')save();else if(v=='r'){m.remove();r({url:''})}else if(v=='0'||e.target==m){m.remove();r(null)}};
 inp.addEventListener('keydown',e=>{if(e.key=='Enter'){e.preventDefault();save()}});document.body.append(m);inp.focus()})}
async function setLink(cid,addr,url){const c=S.customers.find(x=>x.id==cid);if(!c)throw new Error('Customer not found');const k=akey(addr),ex=(c.addresses||[]).find(x=>akey(x)==k),a=ex||addr;
 const rec={...c,addresses:ex?c.addresses:[...(c.addresses||[]),a],links:[...(c.links||[]).filter(l=>akey(l.a)!=k),...(url?[{a,u:url}]:[])]};
 const upd=S.orders.filter(o=>o.cust?.id==cid&&akey(o.address)==k).map(o=>({...o,mapUrl:url}));
 await bulkPut('customers',[rec]);if(upd.length)await bulkPut('orders',upd);return rec}
function curOrd(){const[,a,b]=location.hash.split('/');if(a=='o')return S.orders.find(x=>x.id==b)||null;if(a=='n'){const n=S.notes.find(x=>x.id==b);return n?ord(n):null}return null}
function phInput(){return new Promise(r=>{const m=document.createElement('div');m.className='modal';m.innerHTML='<div class="box" role="dialog" aria-modal="true"><p><b>Add phone number</b></p><input class="pi" type="tel" inputmode="tel" dir="ltr" placeholder="09xxxxxxxx" autocomplete="off"><small class="hint">Libyan mobile: 10 digits starting with 09.</small><div class="bt" style="margin-top:12px"><button data-m="0">Cancel</button><button data-m="1">Save</button></div></div>';
 const inp=$('input',m),save=async()=>{const n=libPh(inp.value);if(!n){await warn(phMsg(inp.value.trim()));inp.focus();return}m.remove();r(n)};
 m.onclick=e=>{const v=e.target.dataset?.m;if(v=='1')save();else if(v=='0'||e.target==m){m.remove();r(null)}};
 inp.addEventListener('keydown',e=>{if(e.key=='Enter'){e.preventDefault();save()}});document.body.append(m);inp.focus()})}
const adr=(o,tap)=>{if(!o.address)return'';const row=`<div class="m ad"><span>Deliver to:</span><span dir="auto">${esc(wd(o.address))}</span></div>`;return tap&&ordLink(o)?`<div class="adrw">${row}${mapBtn('gmap')}</div>`:row};
/* ---- domain ---- */
const dnst=n=>NS[n.status]&&n.status!='all'?n.status:'delivered';
const sumq=(oid,lid,ex,upto,f)=>r3(S.notes.filter(n=>n.orderId==oid&&n.id!=ex&&(!upto||n.at<=upto)&&f(n)).reduce((a,n)=>a+(n.lines.find(l=>l.lid==lid)?.qty||0),0));
const dq=(oid,lid,ex,upto)=>sumq(oid,lid,ex,upto,n=>dnst(n)=='delivered');
const aq=(oid,lid,ex)=>sumq(oid,lid,ex,null,()=>true);
const canDN=o=>!o.closed&&o.lines.some(l=>r3(l.qty-aq(o.id,l.lid))>0);
const alloc=o=>!o.closed&&o.lines.length>0&&o.lines.every(l=>aq(o.id,l.lid)>=l.qty);
const status=o=>{if(o.closed)return'closed';const d=o.lines.map(l=>dq(o.id,l.lid));if(!d.some(x=>x>0))return'pending';return o.lines.every((l,i)=>d[i]>=l.qty)?'fulfilled':'partial'};
const ord=n=>S.orders.find(o=>o.id==n.orderId);
const prog=o=>[r3(o.lines.reduce((a,l)=>a+Math.min(dq(o.id,l.lid),l.qty),0)),r3(o.lines.reduce((a,l)=>a+l.qty,0))];
/* ---- ui helpers ---- */
const CK='<svg class="ck" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4.8 8.3l2.2 2.2 4.2-4.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const badge=(s,o)=>o&&(s=='pending'||s=='partial')&&alloc(o)?`<span class="badge al" title="Fully allocated to delivery notes">${CK}${ST[s]}</span>`:`<span class="badge">${ST[s]}</span>`;
const nbadge=s=>`<span class="badge">${NS[s]}</span>`;
function toast(m,ms=2600,pen){if(!pen&&Date.now()-PENT<1500)return;$('#toast')?.remove();const d=document.createElement('div');d.id='toast';d.textContent=m;document.body.append(d);setTimeout(()=>d.remove(),ms)}
const ask=(msg,ok='Delete',cls='danger')=>new Promise(r=>{const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="box" role="alertdialog" aria-modal="true"><p>${esc(msg)}</p><div class="bt"><button data-v="0">Cancel</button><button data-v="1" class="${cls}">${esc(ok)}</button></div></div>`;m.onclick=e=>{const v=e.target.dataset?.v;if(v!=null||e.target==m){m.remove();r(v=='1')}};document.body.append(m);$('[data-v="0"]',m).focus()});
function pick(list,cb,ph,addCb,addLbl='Add New Customer',emptyMsg=''){const ix=list.map(x=>({x,s:norm(`${x.name} ${x.code||''}`),n:norm(x.name)}));const m=document.createElement('div');m.className='sheet';m.innerHTML=`<div class="sh"><input type="search" dir="auto" role="combobox" aria-expanded="true" aria-controls="pl" autocomplete="off" placeholder="${esc(ph)}"><button type="button" class="ib cx" aria-label="Cancel">Cancel</button></div><div id="pl" role="listbox"></div>`;document.body.append(m);const inp=$('input',m),pl=$('#pl',m);let r=[];
 const draw=()=>{const txt=inp.value.trim(),add=addCb&&txt&&!ix.some(e=>e.n==norm(txt))?`<div role="option" class="opt add" data-add="1"><b>+ ${esc(addLbl)}</b><small dir="auto">${esc(txt)}</small></div>`:'';const q=norm(inp.value).split(/\s+/).filter(Boolean);r=[];for(const e of ix)if(q.every(w=>e.s.includes(w)))r.push(e.x);pl.innerHTML=add+(r.map((x,i)=>`<div role="option" class="opt" data-i="${i}"><b dir="auto">${esc(nm(x))}</b><small>${esc([x.code,x.unit,x.phone].filter(Boolean).join(' · '))}</small></div>`).join('')||(add?'':`<p class="empty">${esc(emptyMsg&&!ix.length&&!txt?emptyMsg:'No matches')}</p>`))};
 inp.oninput=draw;m.onclick=e=>{const o=e.target.closest('.opt');if(o){m.remove();o.dataset.add?addCb(inp.value.trim()):cb(r[o.dataset.i])}else if(e.target.closest('.ib'))m.remove()};draw();inp.focus()}
const AB={ORD:'Ordered',DLV:'Delivered',REM:'Remaining',TDN:'This note'};
const hd=k=>`<span><button type="button" class="ab" data-tip="${AB[k]}" aria-label="${AB[k]}">${k}</button></span>`;
const CP='<svg class="cpi" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const cnh=(cid,name)=>`<h3 dir="auto" class="cpy" role="button" data-a="cpc" data-id="${esc(cid)}" aria-label="Copy customer name and code"><span>${esc(name)}</span>${CP}</h3>`;
const cpTxt=c=>{const n=nm(c).replace(/\s+/g,' ').trim(),k=String(c.code||'').replace(/\s+/g,' ').trim();return k?`${n} - ${k}`:n};
async function copyText(t){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(t);return true}}catch{}
 try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;top:0;left:0;opacity:0;font-size:16px';document.body.append(a);a.select();a.setSelectionRange(0,t.length);const ok=document.execCommand('copy');a.remove();return ok}catch{return false}}
const ctx=(name,meta,extra='',cid='')=>`<div class="card" style="--c:var(--pri)"><div class="cb" style="cursor:default">${cid?cnh(cid,name):`<h3 dir="auto">${esc(name)}</h3>`}<div class="m">${meta}</div>${extra}</div></div>`;
/* ---- views ---- */
let D=null,F='all',FN='all',Q='',prevA='',LIST=()=>'';
const go=h=>location.hash==h?view():(location.hash=h);
const nf=()=>({t:'Not found',back:'#/orders',nav:'orders',html:`<p class="empty">Not found</p>`});
const oCard=o=>{const s=status(o),[d,q]=prog(o);return`<article class="card s-${s}"><div class="cb" data-go="#/o/${o.id}"><div class="r"><h3 dir="auto">${esc(cn(o))}</h3>${badge(s,o)}</div><div class="m">${o.no} · ${fdt(o.at)}</div>${adr(o)}<div class="pg"><i style="width:${q?Math.round(d/q*100):0}%"></i></div><div class="m">${d} of ${q} delivered</div>${o.invoiceId||o.conversionLock||o.pp>0?`<div class="cstr">${o.pp>0?'<i class="pp" title="Prepaid">$</i>':''}${o.conversionLock?'<span class="inv lk" title="Being converted to an invoice">Locked</span>':''}${o.invoiceId?`<span class="inv" dir="ltr" title="Invoiced">${CK}<b>Invoiced</b><span>${esc(o.invoiceId)}</span></span>`:''}</div>`:''}</div><div class="ca"><button data-a="oe" data-id="${o.id}">Edit</button><button data-a="oc" data-id="${o.id}">${o.closed?'Reopen':'Mark Closed'}</button><button class="danger" data-a="od" data-id="${o.id}">Delete</button></div></article>`};
const nCard=n=>{const o=ord(n),s=dnst(n);return`<article class="card s-${s}"><div class="cb" data-go="#/n/${n.id}"><div class="r"><h3 dir="auto">${esc(cn(o))}</h3>${nbadge(s)}</div><div class="m">${n.no} · ${o.no} · ${fdt(n.at)}</div>${adr(o)}</div><div class="ca"><button data-a="ne" data-id="${n.id}">Edit</button><button class="danger" data-a="nd" data-id="${n.id}">Delete</button></div></article>`};
const srt=a=>a.slice().sort((x,y)=>y.at.localeCompare(x.at));
const MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const dkey=i=>{const d=new Date(i);return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()};
const dlab=i=>{const d=new Date(i),t=new Date(),k=dkey(i);return k==dkey(t)?'Today':k==dkey(new Date(t.getFullYear(),t.getMonth(),t.getDate()-1))?'Yesterday':`${d.getDate()} ${MO[d.getMonth()]} ${d.getFullYear()}`};
const grp=(arr,card)=>{let out='',k=null;for(const x of arr){const kk=dkey(x.at);if(kk!==k){if(k!==null)out+='</section>';out+=`<section class="dg"><div class="dd"><span>${dlab(x.at)}</span></div>`;k=kk}out+=card(x)}return out?out+'</section>':''};
function vOrders(){LIST=()=>{const q=norm(Q);return grp(srt(S.orders).filter(o=>(F=='all'||status(o)==F)&&(!q||norm(cn(o)+' '+o.cust.name+' '+o.no).includes(q))),oCard)||`<p class="empty">Nothing here yet. Tap + to add one.</p>`};
 return{t:'Orders',fab:'#/o/new',nav:'orders',html:`<div class="stk"><div class="bar"><input id="q" type="search" dir="auto" placeholder="Search…" value="${esc(Q)}"></div><div class="chips">${['all','pending','partial','fulfilled','closed'].map(s=>`<button class="chip${F==s?' on':''}" data-a="filt" data-id="${s}">${ST[s]}</button>`).join('')}</div></div><div id="list">${LIST()}</div>`}}
function vNotes(){LIST=()=>{const q=norm(Q);return grp(srt(S.notes.filter(ord)).filter(n=>(FN=='all'||dnst(n)==FN)&&(!q||norm(cn(ord(n))+' '+n.no+' '+ord(n).no).includes(q))),nCard)||`<p class="empty">Nothing here yet. Tap + to add one.</p>`};
 return{t:'Delivery Notes',fab:'#/n/new',nav:'notes',html:`<div class="stk"><div class="bar"><input id="q" type="search" dir="auto" placeholder="Search…" value="${esc(Q)}"></div><div class="chips">${['all','loading','dispatched','delivered'].map(s=>`<button class="chip${FN==s?' on':''}" data-a="filtn" data-id="${s}">${NS[s]}</button>`).join('')}</div></div><div id="list">${LIST()}</div>`}}
function vOrder(id){const o=S.orders.find(x=>x.id==id);if(!o)return nf();const s=status(o),open=canDN(o);
 return{share:1,t:o.no,back:'#/orders',nav:'orders',html:`<div class="card s-${s}"><div class="cb" style="cursor:default"><div class="r">${cnh(o.cust.id,cn(o))}${badge(s,o)}</div>${ordPh(o,1)}<div class="m">${o.no} · ${fdt(o.at)}</div>${o.invoiceId?`<div class="ivd">${CK}<span>Invoiced</span><b dir="ltr">${esc(o.invoiceId)}</b></div>`:''}${o.conversionLock?'<div class="ivd lkd"><span>This Order is being Converted to Invoice.</span></div>':''}${o.pp>0?`<div class="ivd ppd"><i class="pp">$</i><span>Prepaid</span><b dir="ltr">${fmtM(o.pp)}</b></div>`:''}${adr(o,1)}${o.note?`<div class="nb" dir="auto" tabindex="0">${esc(o.note)}</div>`:''}</div></div>
 <div class="card"><div class="row h"><span style="text-align:start">Item</span>${hd('ORD')}${hd('DLV')}${hd('REM')}</div>${o.lines.map(l=>{const d=dq(o.id,l.lid);return`<div class="row"><b dir="auto">${esc(nm(l))}</b><span>${l.qty}</span><span>${d}</span><span>${r3(l.qty-d)}</span></div>`}).join('')}</div>
 ${S.notes.some(n=>n.orderId==id)?`<div class="sec">Delivery Notes</div>${srt(S.notes.filter(n=>n.orderId==id)).map(nCard).join('')}`:''}
 <div class="act">${o.conversionLock?`<button class="btn" data-a="orel" data-id="${id}">Release conversion lock</button>`:''}${open?`<button class="btn" data-go="#/n/new/${id}">New delivery note</button>`:''}<button class="btn alt" data-a="oe" data-id="${id}">Edit</button><button class="btn alt" data-a="oc" data-id="${id}">${o.closed?'Reopen':'Mark Closed'}</button><button class="btn alt danger" data-a="od" data-id="${id}">Delete</button></div>`}}
function vNote(id){const n=S.notes.find(x=>x.id==id);if(!n||!ord(n))return nf();const o=ord(n),s=dnst(n);
 return{share:1,t:n.no,back:'#/notes',nav:'notes',html:`<div class="card s-${s}"><div class="cb" style="cursor:default"><div class="r">${cnh(o.cust.id,cn(o))}${nbadge(s)}</div>${ordPh(o,1)}<div class="m">${n.no} · ${fdt(n.at)}</div><div class="m"><a href="#/o/${o.id}" style="color:var(--pri)">Order ${o.no}</a></div>${adr(o,1)}${n.note?`<div class="nb" dir="auto" tabindex="0">${esc(n.note)}</div>`:''}</div></div>
 <div class="card"><div class="row h r2"><span style="text-align:start">Item</span>${hd('TDN')}${hd('ORD')}</div>${n.lines.map(x=>{const l=o.lines.find(y=>y.lid==x.lid);return`<div class="row r2"><b dir="auto">${esc(nm(l))}</b><span>${x.qty}</span><span>${l.qty}</span></div>`}).join('')}</div>
 <div class="act"><button class="btn alt" data-a="ne" data-id="${id}">Edit</button><button class="btn alt danger" data-a="nd" data-id="${id}">Delete</button></div>`}}
function vOForm(id){const o=id&&S.orders.find(x=>x.id==id);if(id&&!o)return nf();
 if(!D||D._k!=location.hash)D=o?{...structuredClone(o),_k:location.hash}:{_k:location.hash,id:uid(),cust:null,address:'',mapUrl:'',note:'',pp:'',lines:[]};
 const lock=o&&S.notes.some(n=>n.orderId==o.id);
 return{t:(o?'Edit Order':'New Order'),back:o?'#/o/'+id:'#/orders',nav:'orders',html:`${o?ctx(cn(o),`${o.no} · ${fdt(o.at)}`,'',o.cust.id):''}<div class="fld"><label>Customer</label><button class="pk" dir="auto" data-a="pickc" ${lock?'disabled':''}>${esc(D.cust?cn(D):'Select customer…')}</button>${D.cust?`<div class="phr">${ordPh(D,1)}<button class="phadd" data-a="ocph" aria-label="Add phone number"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/><path d="M17 2h2v3h3v2h-3v3h-2V7h-3V5h3z"/></svg></button></div>`:''}</div><div class="fld"><label>Delivery Address (optional)</label><div class="pkr"><button class="pk" dir="auto" data-a="picka">${esc(D.address?wd(D.address):'Select delivery address…')}</button>${mapBtn('mlink',null,!(D.address&&ordLink(D)))}${D.address?`<button class="ib danger" data-a="adrx" aria-label="Clear delivery address">${TR}</button>`:''}</div></div><div class="fld"><label>Note (optional)</label><textarea class="ta" rows="1" dir="auto" data-k="note" autocomplete="off">
${esc(D.note)}</textarea></div>${o&&o.invoiceId?`<div class="fld"><div class="ivd">${CK}<span>Invoiced</span><b dir="ltr">${esc(o.invoiceId)}</b></div><small class="hint">Changing the customer, items or quantities voids this invoice.</small></div>`:''}<div class="fld"><label>Prepaid Amount (optional)</label><div class="st pp1" dir="ltr"><input inputmode="decimal" data-pp="1" data-k="pp" maxlength="12" placeholder="0" autocomplete="off" enterkeyhint="done" value="${D.pp?esc(String(D.pp)):''}"></div></div><div class="lab">Items</div>
 ${D.lines.map((l,i)=>{const dl=o?aq(o.id,l.lid):0,dd=o?dq(o.id,l.lid):0;const hl=D.hl==l.lid;return`<div class="ln${hl?' new':''}"><div class="lt"><b dir="auto">${esc(nm(l))}</b><small>${esc([l.code,l.unit].filter(Boolean).join(' · '))}${dl?` · Delivered: ${dd}${dl>dd?` · On open DNs: ${r3(dl-dd)}`:''}`:''}</small>${hl?'<span class="nw">NEW</span>':''}</div><div class="st" dir="ltr"><button data-a="step" data-i="${i}" data-s="-1">−</button><input inputmode="decimal" data-q="${i}" data-min="${dl}" data-max="" data-pos="1" value="${l.qty}"><button data-a="step" data-i="${i}" data-s="1">+</button></div>${dl?'':`<button class="ib danger" data-a="rm" data-i="${i}" aria-label="Delete">${TR}</button>`}</div>`}).join('')}
 <button class="btn alt" data-a="pickd">+ Add item</button><button class="btn" data-a="osave">Save</button>`}}
function vNForm(id,oid){const n=id&&S.notes.find(x=>x.id==id);if(id&&!n)return nf();const o=S.orders.find(x=>x.id==(n?n.orderId:oid));if(!o)return nf();
 if(!D||D._k!=location.hash){D={_k:location.hash,id:n?.id||uid(),oid:o.id,status:n?dnst(n):'loading',note:n?.note||'',qty:{}};n?.lines.forEach(l=>D.qty[l.lid]=l.qty)}
 return{t:(n?'Edit Delivery Note':'New Delivery Note'),back:n?'#/n/'+id:'#/o/'+o.id,nav:'notes',html:`<div class="card"><div class="cb" style="cursor:default">${cnh(o.cust.id,cn(o))}${ordPh(o,1)}${n?`<div class="m">${n.no} · ${fdt(n.at)}</div>`:''}<div class="m">Order ${o.no}</div>${adr(o)}</div></div>
 ${o.lines.map(l=>{const rem=r3(l.qty-aq(o.id,l.lid,n?.id)),v=D.qty[l.lid]||0,av=r3(rem-v);return`<div class="ln${av==0?' full':av<0?' over':''}"><div class="lt"><b dir="auto">${esc(nm(l))}</b><small>Available: <b class="av" data-av="${l.lid}">${av}</b></small></div><div class="st" dir="ltr"><button data-a="step" data-i="${l.lid}" data-s="-1" ${rem<=0?'disabled':''}>−</button><input inputmode="decimal" data-q="${l.lid}" data-min="0" data-max="${rem}" value="${v}" ${rem<=0?'disabled':''}><button data-a="step" data-i="${l.lid}" data-s="1" ${rem<=0?'disabled':''}>+</button></div></div>`}).join('')}
 <button class="btn alt" data-a="all">Deliver all available</button><div class="fld" style="margin-top:14px"><label>Status</label><select data-k="status">${['loading','dispatched','delivered'].map(x=>`<option value="${x}"${D.status==x?' selected':''}>${NS[x]}</option>`).join('')}</select></div><div class="fld"><label>Note (optional)</label><textarea class="ta" rows="1" dir="auto" data-k="note" autocomplete="off">
${esc(D.note)}</textarea></div><button class="btn" data-a="nsave">Save</button>`}}

let CD=null,RET=null,CPRE='';
const cCard=(c,k)=>`<article class="card" style="--c:var(--pri)"><div class="cb" data-go="#/c/${c.id}"><div class="r"><h3 dir="auto">${esc(nm(c))}</h3><span class="oc">${k} ${k==1?'active order':'active orders'}</span></div>${phRow(phOf(c))}${c.code?`<div class="m">${esc(c.code)}</div>`:phOf(c).length?'':'<div class="m">&nbsp;</div>'}</div><div class="ca"><button data-a="ce" data-id="${c.id}">Edit</button><button class="danger" data-a="cd" data-id="${c.id}">Delete</button></div></article>`;
function vCustomers(){LIST=()=>{const q=norm(Q),l=S.customers.filter(c=>!q||norm(c.name+' '+(c.code||'')+' '+phOf(c).join(' ')).includes(q)).sort((a,b)=>nm(a).localeCompare(nm(b),'ar'));const cnt=new Map();S.orders.forEach(o=>{const i=o.cust?.id;if(i!=null)cnt.set(i,(cnt.get(i)||0)+1)});return l.slice(0,100).map(c=>cCard(c,cnt.get(c.id)||0)).join('')+(l.length>100?`<p class="empty">Showing 100 of ${l.length}. Search to narrow.</p>`:'')||`<p class="empty">No customers yet. Tap + to add one.</p>`};
 return{t:'Customers',fab:'#/c/new',nav:'customers',html:`<div class="stk"><div class="bar"><input id="q" type="search" dir="auto" placeholder="Search…" value="${esc(Q)}"></div></div><div class="seg xs" style="margin:10px 0"><button class="btn alt" data-a="expc"><span class="xl">Export Customers</span><span class="cnt">${S.customers.length}</span></button><button class="btn alt" data-a="impf" data-s="customers">Import JSON</button></div><div id="list">${LIST()}</div>`}}
function vCust(id){const c=S.customers.find(x=>x.id==id);if(!c)return nf();const k=S.orders.filter(o=>o.cust?.id==c.id).length,ad=c.addresses||[],tel=String(c.phone||'').replace(/[^\d+]/g,'');
 return{share:1,t:'Customer',back:'#/customers',nav:'customers',html:`<div class="card" style="--c:var(--pri)"><div class="cb" style="cursor:default"><div class="r">${cnh(c.id,nm(c))}<span class="oc">${k} ${k==1?'active order':'active orders'}</span></div>${phRow(phOf(c),1)}${c.code?`<div class="m">Code: <span dir="auto">${esc(c.code)}</span></div>`:''}</div></div><div class="sec">Delivery Addresses</div>${ad.length?ad.map((a,i)=>`<div class="card"><div class="cb adrw" style="cursor:default"><div dir="auto" style="flex:1;min-width:0;white-space:pre-wrap;overflow-wrap:anywhere">${esc(wd(a))}</div>${lnkOf(c,a)?mapBtn('gmapc',i):''}</div></div>`).join(''):'<p class="empty">No delivery addresses saved.</p>'}<div class="act"><button class="btn alt" data-a="ce" data-id="${c.id}">Edit</button><button class="btn alt danger" data-a="cd" data-id="${c.id}">Delete</button></div>`}}
function vCForm(id){const c=id&&S.customers.find(x=>x.id==id);if(id&&!c)return nf();
 if(!CD||CD._k!=location.hash){CD={_k:location.hash,id:c?c.id:uid(),code:c?.code||'',name:c?c.name:CPRE,phones:[...phOf(c)],ph0:[...phOf(c)],addresses:[...(c?.addresses||[])],maps:(c?.addresses||[]).map(a=>lnkOf(c,a))};CPRE=''}
 return{t:c?'Edit Customer':'New Customer',back:RET?RET.hash:c?'#/c/'+c.id:'#/customers',nav:'customers',html:`<div class="fld"><label>Name</label><input dir="auto" data-ck="name" value="${esc(CD.name)}" autocomplete="off"></div><div class="fld"><label>Code (optional)</label><input data-ck="code" value="${esc(CD.code)}" autocomplete="off"></div><div class="lab">Phone Numbers (optional)</div>${CD.phones.map((p,i)=>`<div class="ar"><input data-pk="${i}" inputmode="tel" dir="ltr" placeholder="Phone number" value="${esc(p)}" autocomplete="off"><button class="ib danger" data-a="pdel" data-i="${i}" aria-label="Delete phone number">${TR}</button></div>`).join('')}<button class="btn alt" data-a="padd" style="margin:0 0 14px">+ Add phone number</button><div class="lab">Delivery Addresses</div>${CD.addresses.map((a,i)=>`<div class="ar"><textarea class="ta" rows="1" dir="auto" data-ak="${i}" placeholder="Address" autocomplete="off">
${esc(a)}</textarea>${mapBtn('mlinkc',i,!CD.maps[i])}<button class="ib danger" data-a="adel" data-i="${i}" aria-label="Delete address">${TR}</button></div>`).join('')}<button class="btn alt" data-a="aadd" style="margin:0 0 14px">+ Add address</button><button class="btn" data-a="csave">Save</button>`}}
const APP_VER='V14.1',APP_DEV='ShlibekTech',APP_MAIL='shlibek@outlook.com';
function vAbout(){const tip=(ic,h,t)=>`<li><span class="abt-ic" aria-hidden="true">${ic}</span><div><b>${h}</b><span>${t}</span></div></li>`;
 return{t:'About',back:'#/settings',nav:'settings',html:`<div class="abt"><button class="abt-bk" data-go="#/settings">‹ Back</button>
<div class="abt-hero"><img src="icons/icon-192.png" width="76" height="76" alt=""><h2>Dispatcher</h2><p>Local-First Warehouse Order &amp; Logistics Scratchpad</p><span class="abt-ver">${APP_VER}</span></div>
<div class="card" style="--c:var(--line)"><div class="abt-kv"><span>Version</span><b>${APP_VER}</b></div><div class="abt-kv"><span>Developer</span><b>${APP_DEV}</b></div><div class="abt-kv"><span>Contact</span><a href="mailto:${APP_MAIL}" dir="ltr">${APP_MAIL}</a></div></div>
<div class="sec">How it works</div><div class="card" style="--c:var(--line)"><div class="cb" style="cursor:default"><div class="abt-tx">Dispatcher keeps every order, delivery note and customer in a local IndexedDB database on your phone, so it is always fast and available. Changes are then synchronised securely with Firebase Cloud Firestore in the background.</div></div></div>
<div class="abt-tipbox" role="note"><div class="abt-th">Tips for a stable experience</div><ul>${tip('◎','Browser','Optimized for Google Chrome on Android (WebAPK installation).')}${tip('↻','Offline resilience','Fully functional offline via local storage; automatically syncs with Firebase upon reconnection.')}${tip('🔒','Security','Data write actions are restricted to authorized administrator accounts.')}</ul></div>
<div class="abt-ft">© 2026 ${APP_DEV} · All rights reserved</div></div>`}}
function vSettings(){const imp=k=>`<div class="sec">${k=='customers'?'Customers':'Items'}</div><div class="card" style="--c:var(--line)"><div class="cb" style="cursor:default"><h3>${S[k].length} records</h3><div class="m">Last import: ${S.meta[k+'_at']?fdt(S.meta[k+'_at']):'Never'}</div>${k=='items'?`<div class="seg xs" style="margin-top:10px"><button class="btn alt" data-a="expi"><span class="xl">Export Items</span><span class="cnt">${S.items.length}</span></button><button class="btn alt" data-a="impf" data-s="items">Import JSON</button></div>`:`<button class="btn alt" style="margin-top:10px" data-a="impf" data-s="${k}">Import JSON</button>`}</div></div>`;
 setTimeout(trashSummary,60);return{t:'Settings',nav:'settings',html:`${acct()}${penCard()}<div class="sec">Theme</div><div class="card" style="--c:var(--line)"><div class="cb th" style="cursor:default"><div class="chips">${[['system','System Default'],['light','Light'],['dark','Dark']].map(([k,t])=>`<button class="chip${THEME==k?' on':''}" data-a="theme" data-id="${k}">${t}</button>`).join('')}</div></div></div>${imp('items')}<small class="hint">Accepted: a JSON list of items with name (required), id, code, unit. Files of customers or backups are rejected.</small>
 <div class="sec">Archive &amp; Trash</div><div class="card" style="--c:var(--line)"><div class="cb" style="cursor:default"><div class="m" id="trs">${isAdm()?'Trash: checking…':'Admin only'}</div>${S.arch?.last?`<div class="m">Last archive: before ${esc(S.arch.last.cutoff)} · ${S.arch.last.orders} orders (${fdt(S.arch.last.at)})</div>`:''}<div class="seg" style="margin-top:10px"><button class="btn" data-a="arcopen">Archive</button><button class="btn alt" data-a="trashopen">Trash</button></div></div></div><div class="sec">Backup</div><div class="card" style="--c:var(--line)"><div class="cb" style="cursor:default"><div class="m">${S.orders.length} orders · ${S.notes.length} delivery notes · ${S.customers.length} customers</div><div class="m">Persistent storage: ${persisted?'granted':'not granted'}</div><div class="seg" style="margin-top:10px"><button class="btn" data-a="exps">Export Data</button><button class="btn alt" data-a="expsh">Share</button></div><button class="btn alt" data-a="impbk" style="margin-top:8px">Import Backup</button></div></div><a class="card abt-row" href="#/about" style="--c:var(--line)"><span>About Dispatcher</span><small>${APP_VER}</small><i aria-hidden="true">›</i></a>`}}
const TR='<svg class="tr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.2a2 2 0 002 1.8h6a2 2 0 002-1.8L18 7M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const fmtM=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);
let CHV='';
function keepChips(a,ol,ov){const nc=$('.stk .chips');CHV=nc?a:'';if(!nc)return;const same=ov==a;if(same)nc.scrollLeft=ol;const on=nc.querySelector('.chip.on');if(!on)return;const r=on.getBoundingClientRect(),c=nc.getBoundingClientRect(),m=12;let d=0;if(r.left<c.left+m)d=r.left-c.left-m;else if(r.right>c.right-m)d=r.right-c.right+m;if(d)nc.scrollBy({left:d,behavior:same?'smooth':'auto'})}
const banner=()=>{let m='';if(!fb)m='Cloud sync is unavailable. Data cannot be loaded or changed.';else if(U&&!role())m=`This account (${U.email||'unknown'}) is not authorized to use Dispatcher. Use Switch Account in Settings, or contact your administrator.`;else if(U&&rerr())m=`Cannot load shared data (${rerr()}). Contact your administrator.`;else if(U&&!canWrite()&&got.orders&&got.notes&&got.customers&&got.items&&!S.orders.length&&!S.notes.length&&!S.customers.length&&!S.items.length)m='No shared data found for the administrator account.';else if(isAdm()&&dupInv().length){const g=dupInv()[0];m=`Duplicate Invoice ID ${g[0].invoiceId}: used by ${g.map(o=>o.no).join(' and ')}. Please edit one of them.`}else if(U&&role()&&got.orders&&got.notes&&!S.orders.length&&!S.notes.length&&S.arch?.last)m=`No active orders. Older records were archived on ${fdt(S.arch.last.at)} (closed before ${S.arch.last.cutoff}).`;return m?`<div class="bnr" role="alert">${esc(m)}</div>`:''};
function view(keep){let [a,b,c]=(location.hash.slice(2)||'orders').split('/');let v;
 if(!canWrite()&&isW(a,b,c)){const h=a=='n'?'#/notes':a=='c'?'#/customers':'#/orders';history.replaceState(null,'',h);[a,b,c]=h.slice(2).split('/');D=null;CD=null}
 if(RET&&location.hash==RET.hash){D=RET.d;RET=null}
 if(RET&&!(a=='c'&&b=='new'))RET=null;
 if(!(a=='c'&&(b=='new'||c=='edit')))CD=null;
 if(!(a=='o'&&(b=='new'||c=='edit'))&&!(a=='n'&&(b=='new'||c=='edit')))D=null;
 if(a!=prevA)Q='';prevA=a;if(a!='trash')trashClose();
 if(a=='n'&&b=='new'&&!c){history.replaceState(null,'','#/notes');ACT.nnew()}
 v=a=='archive'?vArchive():a=='trash'?vTrash():a=='settings'?vSettings():a=='about'?vAbout():a=='customers'?vCustomers():a=='c'?(b=='new'||c=='edit'?vCForm(b=='new'?null:b):vCust(b)):a=='notes'||(a=='n'&&b=='new'&&!c)?vNotes():a=='o'?(b=='new'?vOForm():c=='edit'?vOForm(b):vOrder(b)):a=='n'?(b=='new'?vNForm(null,c):c=='edit'?vNForm(b):vNote(b)):vOrders();
 $('#ti').textContent=v.t;const bk=$('#bk');const wa=$('#wa');wa.hidden=!v.share;if(v.share)loadH2I().catch(()=>{});bk.hidden=!v.back;bk.dataset.go=v.back||'';const f=$('#fab');f.hidden=!v.fab;f.href=v.fab||'#';
 $$('nav a').forEach(x=>{x.classList.toggle('on',x.dataset.n==v.nav)});
 const oc=$('.stk .chips'),ol=oc?oc.scrollLeft:0,ov=oc?CHV:'';setHH();hideTip();$('#app').innerHTML=banner()+v.html;setSH();$$('textarea.ta').forEach(grow);keepChips(a,ol,ov);if(!keep)scrollTo(0,0)}
/* ---- cloud sync (Firebase) ---- */
const ADMIN_UID='ZlJYN1xSrTZiYivlHydVIWNBXRo1'; /* shared data root: every account reads/writes users/ADMIN_UID/... */
/* V13.1 role lists (UI only; the Firestore rules enforce the real permissions by UID). Keep in step with firestore.rules_V13.1.txt. Lowercase emails. */
const ADMINS=['shlibek@outlook.com','anas.admin@dispatcher.com','mohmd.admin@dispatcher.com'],VIEWERS=['viewer@dispatcher.com'];
let RE={};const rerr=()=>Object.values(RE)[0]||'';
let U=null,DR=null,unsubs=[],inflight=0,syncErr='',persisted=false,asked=false,startedEmpty=false,got={},restored={};
const myMail=()=>(U?.email||'').toLowerCase(),role=()=>!U?'':ADMINS.includes(myMail())?'admin':VIEWERS.includes(myMail())?'viewer':'';let roSess=false;
const isAdm=()=>role()=='admin'&&!roSess,canWrite=()=>isAdm();
const needAdmin=()=>{if(isAdm())return false;toast('This action requires Administrator privileges.',3200);return true};
const cdoc=(k,id)=>FB.doc(fb.db,'users',DR,k,String(id).replace(/\//g,'_'));
const seqOf=x=>parseInt(String(x.no||'').split('-')[1],10)||0;
const fixCounters=()=>{S.meta.ord=Math.max(S.meta.ord,...S.orders.map(seqOf));S.meta.dn=Math.max(S.meta.dn,...S.notes.map(seqOf))};
/* ===== V14.0: The Pen (Single-Writer Lease) =====
   Only the Pen Holder can write. Every write is a fail-fast transaction (never queued).
   The lease lives in users/<root>/meta/lease and is enforced by the Firestore rules. */
let LEASE=null,PENT=0,BOOT=false;
const nameOf=e=>{const s=String(e||'').split('@')[0].replace(/\.admin$/i,'');return s?s[0].toUpperCase()+s.slice(1):'Unknown'};
const leaseRef=()=>cdoc('meta','lease');
const mkLease=(how,email)=>({email:String(email).toLowerCase(),name:nameOf(email),at:new Date().toISOString(),how,by:myMail()});
const holdsPen=()=>isAdm()&&!!LEASE&&String(LEASE.email||'').toLowerCase()==myMail();
const blockedMsg=d=>d&&d.email?`Only the Pen Holder can edit. ${d.name||nameOf(d.email)} currently holds the Pen.`:'Only the Pen Holder can edit. The Pen has not been set up yet.';
const penToast=(m,ms=6500,q)=>{if(q)return;PENT=Date.now();toast(m,ms,1)};
const needPen=()=>{if(needAdmin())return true;if(!navigator.onLine){penToast('You are offline. Dispatcher is read-only until the connection returns.',4500);return true}
 if(holdsPen())return false;penToast(blockedMsg(LEASE),4500);return true};
class PenErr extends Error{constructor(m){super(m);this.pen=true}}
const penErr=(m,ms,q)=>{penToast(m,ms,q);return new PenErr(m)};
const notHolder=d=>Object.assign(new Error('not the Pen Holder'),{lease:d});
function penChip(){const el=$('#pn');if(!el)return;const a=!!U&&role()=='admin';el.hidden=!a;if(!a)return;const me=holdsPen();
 el.className='sy pn '+(me?'me':LEASE?'ot':'no');el.textContent=me?'You hold the Pen':LEASE?'Pen: '+(LEASE.name||nameOf(LEASE.email)):'Pen: not set'}
function penUi(){penChip();if(location.hash=='#/settings')refresh()}
function onLease(snap){const was=LEASE,d=snap.exists()?snap.data():null;LEASE=d;
 if(was&&d&&was.email==d.email&&was.at==d.at){penChip();return}
 if(U&&role()=='admin'){const wasMe=!!was&&String(was.email||'').toLowerCase()==myMail();
  if(wasMe&&d&&String(d.email||'').toLowerCase()!=myMail())penToast(`You no longer hold the Pen. ${d.name||nameOf(d.email)} is now the Pen Holder.`)}
 penUi();
 if(!d&&!snap.metadata.fromCache&&role()=='admin'&&navigator.onLine)bootstrapPen()}
async function bootstrapPen(){if(BOOT||!U||role()!='admin')return;BOOT=true;
 try{await FB.runTransaction(fb.db,async tx=>{const s=await tx.get(leaseRef());if(s.exists())return;tx.set(leaseRef(),mkLease('bootstrap',myMail()))})}
 catch(e){console.warn('pen bootstrap',e)}finally{BOOT=false}}
function sync(){const el=$('#sy');penChip();if(!el)return;let c='ok',x='Synced';
 if(!fb||!U){c='warn';x='Signed out'}else if(roSess){c='warn';x='Read-only'}else if(syncErr||rerr()){c='err';x='Sync error'}else if(!navigator.onLine){c='warn';x='Offline, read-only'}else if(inflight>0){c='warn';x='Saving…'}
 el.className='sy '+c;el.textContent=x}
const pbusy=on=>{inflight=Math.max(0,inflight+(on?1:-1));document.body.classList.toggle('saving',inflight>0);sync()};
const onDenied=()=>{if(!roSess){roSess=true;toast('This change was not saved: your account does not have administrator privileges. This session is now read-only.',6500)}sync();view(true)};
/* Reclassify a failure. "permission-denied" now normally means "you do not hold the Pen": re-read the lease from the server.
   Only a valid admin who DOES hold the Pen and is still denied is treated as an invalid account (old read-only behaviour). */
async function penFail(e,q){
 if(e&&e.pen)return e;
 if(e&&e.app)return e;
 if(e&&e.lease!==undefined){if(e.lease)LEASE=e.lease;penUi();return penErr(blockedMsg(e.lease),6500,q)}
 if(e&&e.code=='permission-denied'){
  try{const s=await FB.getDocFromServer(leaseRef());LEASE=s.exists()?s.data():null;penUi();
   if(role()=='admin'&&!holdsPen())return penErr(blockedMsg(LEASE),6500,q)}
  catch(x){console.warn(x);return penErr('Not saved: could not confirm the Pen with the server. Check your connection and try again.',6500,q)}
  if(!q)onDenied();return new PenErr('denied')}
 console.warn(e);return penErr('Not saved: could not reach the server. Check your connection and try again.',6500,q)}
/* The ONLY write path. One fail-fast transaction: it reads the lease first (so it cannot run offline and cannot run
   without the Pen), then applies fn. Nothing is ever queued. q = quiet (background self-healing: no shield, no toasts). */
async function ptx(fn,q){
 if(!canWrite())throw new Error('Administrator privileges required');
 if(!navigator.onLine)throw penErr('Not saved: you are offline. Saving needs an internet connection.',6000,q);
 if(!q)pbusy(1);
 try{return await FB.runTransaction(fb.db,async tx=>{const s=await tx.get(leaseRef()),d=s.exists()?s.data():null;
   if(!d||String(d.email||'').toLowerCase()!=myMail())throw notHolder(d);return fn(tx)})}
 catch(e){throw await penFail(e,q)}
 finally{if(!q)pbusy(0)}}
const wtx1=(ops,q)=>ptx(async tx=>{for(const[t,ref,data,mg]of ops){if(t=='d')tx.delete(ref);else if(mg)tx.set(ref,data,{merge:true});else tx.set(ref,data)}},q);
async function wtx(ops,q){for(let i=0;i<ops.length;i+=400)await wtx1(ops.slice(i,i+400),q)}
const put=async(k,rec,q)=>{await wtx1([['s',cdoc(k,rec.id),rec]],q);upsert(S[k],rec)};
const delRec=async(k,id,q)=>{await wtx1([['d',cdoc(k,id)]],q);S[k]=S[k].filter(x=>x.id!=id)};
/* Lease changes (handoff / override / reset). Not gated by "must hold the Pen" except handoff. */
async function leaseTx(fn){
 if(!navigator.onLine)throw penErr('You are offline. The Pen can only be changed online.',5000);
 pbusy(1);try{return await FB.runTransaction(fb.db,async tx=>{const s=await tx.get(leaseRef());return fn(tx,s.exists()?s.data():null)})}
 catch(e){throw await penFail(e)}finally{pbusy(0)}}
async function passPen(email){const nl=mkLease('handoff',email);
 await leaseTx((tx,d)=>{if(!d||String(d.email||'').toLowerCase()!=myMail())throw notHolder(d);tx.set(leaseRef(),nl)});LEASE=nl;penUi();return nl}
async function takePen(how){const nl=mkLease(how,myMail());await leaseTx(tx=>{tx.set(leaseRef(),nl)});LEASE=nl;penUi();return nl}
function penPicker(){return new Promise(r=>{const others=ADMINS.filter(e=>e!=myMail());const m=document.createElement('div');m.className='modal';
 m.innerHTML=`<div class="box" role="dialog" aria-modal="true"><p><b>Pass the Pen to…</b></p><p class="m">Confirm on the radio first.</p><div class="penl">${others.map(e=>`<button type="button" class="btn alt" data-e="${esc(e)}">${esc(nameOf(e))}</button>`).join('')}</div><div class="bt"><button data-v="0">Cancel</button></div></div>`;
 m.onclick=e=>{const b=e.target.closest('[data-e]');if(b){m.remove();r(b.dataset.e)}else if(e.target.dataset?.v!=null||e.target==m){m.remove();r(null)}};document.body.append(m)})}
const HOWT={handoff:'passed on',override:'taken by override',bootstrap:'first set-up',reset:'reset by the owner'};
const penCard=()=>{if(!U||role()!='admin')return'';const me=holdsPen(),h=LEASE;
 return`<div class="sec">The Pen</div><div class="card" style="--c:var(--acc)"><div class="cb" style="cursor:default"><div class="m">${me?'<b>You hold the Pen.</b> Only the Pen Holder can edit.':h?`Pen Holder: <b>${esc(h.name||nameOf(h.email))}</b>`:'The Pen has not been set up yet.'}</div>${h?.at?`<div class="m">Since ${esc(fdt(h.at))} · ${esc(HOWT[h.how]||'')}</div>`:''}${me?'<button class="btn" data-a="penpass" style="margin-top:10px">Pass the Pen to…</button>':'<button class="btn alt" data-a="penover" style="margin-top:10px">Override the Pen</button>'}${U.uid==ADMIN_UID?'<button class="btn alt danger" data-a="penreset" style="margin-top:10px">Reset Pen (owner)</button>':''}</div></div>`};
/* ===== end The Pen core ===== */






const timeout=ms=>new Promise((_,j)=>setTimeout(()=>j(new Error('timeout')),ms));
const localMax=k=>Math.max(S.meta[k]||0,...(k=='ord'?S.orders:S.notes).map(seqOf));
/* Next ORD/DN number (used only by repairDups). Allocated on the server inside the Pen transaction. There is no offline numbering. */
async function nextNo(k,q){const lm=localMax(k);
 const n=await ptx(async tx=>{const r=cdoc('meta','counters'),d=await tx.get(r),c=d.exists()?(d.data()[k]|0):0,v=Math.max(c,lm)+1;tx.set(r,{[k]:v},{merge:true});return v},q);
 S.meta[k]=Math.max(S.meta[k]||0,n);return n}
/* New record + its number in ONE transaction: no gaps, no duplicates. */
async function putNew(k,rec,kd,pre){const lm=localMax(kd);let no='';
 await ptx(async tx=>{const r=cdoc('meta','counters'),d=await tx.get(r),c=d.exists()?(d.data()[kd]|0):0,v=Math.max(c,lm)+1;no=pre+pad(v);tx.set(r,{[kd]:v},{merge:true});tx.set(cdoc(k,rec.id),{...rec,no})});
 rec.no=no;S.meta[kd]=Math.max(S.meta[kd]||0,seqOf(rec));upsert(S[k],rec)}
async function syncCounters(){if(!holdsPen()||!navigator.onLine)return;fixCounters();try{await ptx(async tx=>{const r=cdoc('meta','counters'),d=await tx.get(r),c=d.exists()?d.data():{};tx.set(r,{ord:Math.max(c.ord|0,S.meta.ord),dn:Math.max(c.dn|0,S.meta.dn)},{merge:true})},1)}catch(e){console.warn(e)}}





/* Duplicate-number guard: if two records share a number, the earlier one keeps it; the owner's device renumbers the later one. */
let repairing=false;
async function repairDups(){if(repairing||!holdsPen()||!navigator.onLine)return;repairing=true;
 try{for(const[k,pre,kd]of[['orders','ORD-','ord'],['notes','DN-','dn']]){const g=new Map();
   for(const r of S[k]){if(!r.no)continue;if(!g.has(r.no))g.set(r.no,[]);g.get(r.no).push(r)}
   for(const l of g.values()){if(l.length<2)continue;l.sort((a,b)=>String(a.at).localeCompare(String(b.at))||String(a.id).localeCompare(String(b.id)));
    for(const r of l.slice(1)){if(r.by!==U.uid)continue;const was=r.no,no=pre+pad(await nextNo(kd,1));await put(k,{...r,no},1);toast(`${was} was already taken, so this record was renumbered ${no}.`,6500)}}}}
 catch(e){console.warn(e)}finally{repairing=false}}
/* Local data wipe used by Switch Account / account change: no cached data of the previous account may survive. */
async function purgeLocal(){stop();try{await FB.terminate(fb.db)}catch(e){console.warn(e)}try{await FB.clearIndexedDbPersistence(fb.db)}catch(e){console.warn(e)}
 try{(await DB).close()}catch(e){}await new Promise(r=>{const q=indexedDB.deleteDatabase('dispatcher');q.onsuccess=q.onerror=q.onblocked=()=>r()});try{sessionStorage.clear()}catch(e){}}
async function bulkPut(k,arr){await wtx(arr.map(r=>['s',cdoc(k,r.id),r]));arr.forEach(r=>upsert(S[k],r))}
async function replaceCloud(k,rows,at){const ids=new Set(rows.map(r=>r.id)),gone=S[k].filter(x=>!ids.has(x.id));
 await wtx([...gone.map(x=>['d',cdoc(k,x.id)]),...rows.map(x=>['s',cdoc(k,x.id),x])]);
 await wtx1([['s',cdoc('meta',k),{at}]]);
 S[k]=rows;S.meta[k+'_at']=at}




const refresh=()=>{if(D||$('.sheet,.modal')||document.activeElement?.matches('input,textarea'))return;view(true)};
const stop=()=>{unsubs.forEach(f=>f());unsubs=[]};
function listen(){const need=new Set(['orders','notes','customers','items']);let done;const p=new Promise(r=>done=r);
 const mk=k=>FB.onSnapshot(FB.collection(fb.db,'users',DR,k),snap=>{
  delete RE[k];S[k]=snap.docs.map(d=>d.data());
  if(!snap.metadata.fromCache&&!got[k]){got[k]=1;if(startedEmpty&&S[k].length)restored[k]=S[k].length;if(got.orders&&got.notes&&got.customers&&got.items&&(restored.orders||restored.notes||restored.customers||restored.items))toast(`Restored ${restored.orders||0} orders, ${restored.notes||0} delivery notes, ${restored.customers||0} customers and ${restored.items||0} items from the cloud`)}
  fixCounters();sync();refresh();if((k=='orders'||k=='notes')&&!snap.metadata.fromCache)setTimeout(repairDups,400);need.delete(k);if(!need.size)done()},
  e=>{RE[k]=e.code||'error';sync();view(true);toast('Sync error: '+(e.code||'unknown'));need.delete(k);if(!need.size)done()});
 unsubs=[mk('orders'),mk('notes'),mk('customers'),mk('items'),FB.onSnapshot(cdoc('meta','items'),d=>{const v=d.data();if(v?.at)S.meta.items_at=v.at},()=>{}),FB.onSnapshot(cdoc('meta','archive'),d=>{S.arch=d.data()||{};refresh()},()=>{}),FB.onSnapshot(cdoc('meta','counters'),d=>{const v=d.data();if(v){S.meta.ord=Math.max(S.meta.ord,v.ord|0);S.meta.dn=Math.max(S.meta.dn,v.dn|0)}},()=>{}),FB.onSnapshot(leaseRef(),{includeMetadataChanges:true},onLease,()=>{})];return p}
/* V14.0: uploadStaging retired (no offline writes, no staging upload). */


function pickBackup(){IMPK='backup';impf.value='';impf.click()}
async function impBackup(txt){let j;try{j=JSON.parse(String(txt).replace(/^\uFEFF/,''))}catch(e){return toast('This backup is not valid JSON: '+e.message,6000)}
 const A=x=>Array.isArray(x)?x:[];j=j&&typeof j=='object'?j:{};if(j.kind==='archive')return impArchive(j);
 const o=A(j.orders).filter(r=>r&&r.id&&r.no&&r.at&&r.cust&&Array.isArray(r.lines)),ids=new Set([...o,...S.orders].map(r=>r.id));
 const n=A(j.deliveryNotes||j.notes).filter(r=>r&&r.id&&r.no&&r.at&&ids.has(r.orderId)&&Array.isArray(r.lines));
 const cu=A(j.customers).filter(r=>r&&r.id&&r.name);if(!o.length&&!n.length&&!cu.length)return toast('No orders, delivery notes or customers found in this file.',6000);
 try{const rp=o.filter(r=>S.orders.some(x=>x.id==r.id)).length+n.filter(r=>S.notes.some(x=>x.id==r.id)).length+cu.filter(r=>S.customers.some(x=>x.id==r.id)).length;if(!await ask(`Import ${o.length} orders, ${n.length} delivery notes and ${cu.length} customers? Records with the same ID are overwritten; nothing is deleted.`+(rp?` Warning: ${rp} record(s) already in the app will be replaced by the versions in this file, so any newer changes to them will be lost.`:''),'Import',''))return;
 await bulkPut('orders',o.map(keepLive));await bulkPut('notes',n);await bulkPut('customers',cu.map(r=>({id:String(r.id),code:wd(r.code),name:wd(r.name),...(()=>{const p=cleanPh(r.phones??r.phone);return{phones:p,phone:p[0]||''}})(),addresses:mergeA(String(r.id),r.addresses),links:mergeL(String(r.id),r.links)})));fixCounters();syncCounters();toast(`Imported ${o.length} orders, ${n.length} delivery notes, ${cu.length} customers`);view(true)}catch(e){console.error(e);toast('Backup import failed while saving: '+(e.message||e),6000)}}
function loginSheet(){if($('.login')||!fb)return;const m=document.createElement('div');m.className='sheet login';
 const EYE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 12S5.3 5 12 5s10.5 7 10.5 7-3.8 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',EYEOFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 12S5.3 5 12 5s10.5 7 10.5 7-3.8 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>';
 m.innerHTML=`<div class="lgw"><div class="lgh"><div class="lgl">Dispatcher</div><div class="lgs">Warehouse Order Management</div></div><form id="lf" class="lgform" novalidate><p class="m lgi">Sign in to continue.</p><div class="fld"><label for="em">Email</label><input id="em" name="username" type="email" inputmode="email" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="next" aria-describedby="eme"><p class="lge" id="eme" role="alert"></p></div><div class="fld"><label for="pw">Password</label><div class="pww"><input id="pw" name="password" type="password" autocomplete="current-password" enterkeyhint="go" aria-describedby="pwe"><button type="button" class="pwt" id="pwt" aria-label="Show password" aria-pressed="false">${EYE}</button></div><p class="lge" id="pwe" role="alert"></p></div><p class="lge lgx" id="lgx" role="alert"></p><button class="btn lgb" id="lg1" type="submit"><span class="lgt">Sign in</span><span class="lgp" aria-hidden="true"></span></button></form><p class="lgf">Need access? Contact your warehouse administrator for login credentials.</p></div>`;
 document.body.append(m);
 const emI=$('#em',m),pwI=$('#pw',m),eme=$('#eme',m),pwe=$('#pwe',m),lgx=$('#lgx',m),b=$('#lg1',m),pwt=$('#pwt',m);let busy=false;
 const shake=el=>{el.classList.remove('shk');void el.offsetWidth;el.classList.add('shk')};
 const bad=(i,t)=>{i.classList.add('bad');i.setAttribute('aria-invalid','true');shake(i.closest('.pww')||i);if(t)t.textContent=t.dataset.m||''};
 const fe=(i,t,msg)=>{t.textContent=msg;bad(i)};
 const clr=()=>{[emI,pwI].forEach(i=>{i.classList.remove('bad');i.removeAttribute('aria-invalid')});eme.textContent=pwe.textContent=lgx.textContent=''};
 emI.addEventListener('input',clr);pwI.addEventListener('input',clr);
 emI.addEventListener('keydown',e=>{if(e.key=='Enter'){e.preventDefault();pwI.focus()}});
 pwt.addEventListener('pointerdown',e=>e.preventDefault());
 pwt.onclick=()=>{const show=pwI.type=='password';pwI.type=show?'text':'password';pwt.innerHTML=show?EYEOFF:EYE;pwt.setAttribute('aria-label',show?'Hide password':'Show password');pwt.setAttribute('aria-pressed',show)};
 $('#lf',m).onsubmit=async ev=>{ev.preventDefault();if(busy)return;clr();const em=emI.value.trim(),pw=pwI.value;let first=null;
  if(!em){fe(emI,eme,'Enter your email address.');first=emI}
  if(!pw){fe(pwI,pwe,'Enter your password.');first=first||pwI}
  if(first){first.focus();return}
  busy=true;b.classList.add('ld');b.setAttribute('aria-busy','true');
  try{await FB.signIn(fb.auth,em,pw);m.remove()}
  catch(x){const c=x.code||'';
   if(c=='auth/invalid-email')fe(emI,eme,'Enter a valid email address.');
   else if(['auth/invalid-credential','auth/invalid-login-credentials','auth/wrong-password','auth/user-not-found'].includes(c)){bad(emI);fe(pwI,pwe,'Incorrect email or password.')}
   else if(c=='auth/network-request-failed')lgx.textContent='No connection. The first sign-in on this phone needs an internet connection.';
   else if(c=='auth/too-many-requests')lgx.textContent='Too many attempts. Wait a few minutes and try again.';
   else if(c=='auth/user-disabled')lgx.textContent='This account has been disabled. Contact your administrator.';
   else lgx.textContent='Sign-in failed ('+(c||'error')+').'}
  finally{busy=false;b.classList.remove('ld');b.removeAttribute('aria-busy')}};
 /* keyboard protection: size the sheet to the visible area and keep the buttons in view */
 const vv=window.visualViewport,fit=()=>{if(!m.isConnected){vv?.removeEventListener('resize',fit);vv?.removeEventListener('scroll',fit);return}m.style.bottom=Math.max(0,innerHeight-vv.height-vv.offsetTop)+'px'};
 if(vv){vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit);fit()}
 m.addEventListener('focusin',()=>setTimeout(()=>$('#lg1',m)?.scrollIntoView({block:'nearest',behavior:'smooth'}),300))}
function gate(){if(fb&&!U){loginSheet();return}}

async function foreignUser(u){const k='dispatcher-uid';let p='';try{p=localStorage.getItem(k)||''}catch(e){}
 try{localStorage.setItem(k,u.uid)}catch(e){}
 if(p&&p!=u.uid){await purgeLocal();location.reload();return true}return false}
function authInit(){if(!fb)return gate();let first=true;FB.onAuth(fb.auth,async u=>{stop();U=u;roSess=false;DR=u?ADMIN_UID:null;RE={};LEASE=null;got={};restored={};
 if(u&&await foreignUser(u))return;
 if(u&&role()){startedEmpty=!S.orders.length&&!S.notes.length;await Promise.race([listen(),new Promise(r=>setTimeout(r,3500))])}
 else{S.orders=[];S.notes=[];S.customers=[];S.items=[]}
 fixCounters();sync();refresh();if(first||!u)gate();first=false})}
const acct=()=>{const r=role(),rl=r=='admin'?(roSess?'Administrator (this session is read-only)':'Administrator'):r=='viewer'?'Viewer (read-only)':'No access';
 return`<div class="sec">Account</div><div class="card" style="--c:var(--line)"><div class="cb" style="cursor:default">${!fb?'<div class="m">Cloud sync is unavailable.</div>':U?`<div class="m">Logged in as: <b dir="ltr">${esc(U.email||'Signed in')}</b></div><div class="m">Role: ${rl}</div><div class="m">Status: ${$('#sy')?.textContent||''}</div><div class="m">Data source: ${esc(DR||'').slice(0,6)}… · Read error: ${esc(rerr()||'none')}</div><button class="btn alt" data-a="signout" style="margin-top:10px">Switch account</button>`:`<div class="m">Not signed in.</div><button class="btn" data-a="signin" style="margin-top:10px">Sign in</button>`}</div></div>`};
/* ---- actions ---- */
const stamp=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`};
const dump=(ext='.json',type='application/json')=>new File([JSON.stringify({app:'dispatcher',version:1,exportedAt:new Date().toISOString(),orders:S.orders,deliveryNotes:S.notes,customers:S.customers},null,1)],`dispatcher-${stamp()}${ext}`,{type});
const lim=el=>[+el.dataset.min,el.dataset.max===''?Infinity:+el.dataset.max];
const updAv=i=>{const el=$(`[data-q="${i}"]`),a=$(`[data-av="${i}"]`);if(!el||!a)return;const x=r3(+el.dataset.max-(D.qty[i]||0)),ln=a.closest('.ln');if(a.textContent!=String(x)){a.textContent=x;a.classList.remove('bump');void a.offsetWidth;a.classList.add('bump')}ln.classList.toggle('full',x==0);ln.classList.toggle('over',x<0)};
const setQ=(i,v)=>{if(D.lines){D.lines[i].qty=v;if(D.hl&&D.lines[i].lid==D.hl){D.hl=null;$$('.ln.new').forEach(x=>{x.classList.remove('new');$('.nw',x)?.remove()})}}else{D.qty[i]=v;updAv(i)}};
const ACT={
 filt:id=>{F=id;view()},
 filtn:id=>{FN=id;view()},
 theme:id=>{setTheme(id);view(true)},
 oe:id=>{if(lockedO(S.orders.find(x=>x.id==id)))return lockedToast();go('#/o/'+id+'/edit')},ne:id=>go('#/n/'+id+'/edit'),
 oc:async id=>{const o={...S.orders.find(x=>x.id==id)};o.closed=!o.closed;await put('orders',o);view(true)},
 od:async id=>{const o=S.orders.find(x=>x.id==id),n=S.notes.filter(x=>x.orderId==id);if(!await ask(`Delete order ${o.no}? Its ${n.length} delivery note(s) will be deleted too. This cannot be undone.`))return;for(const x of n)await delRec('notes',x.id);await delRec('orders',id);go('#/orders')},
 nd:async id=>{const n=S.notes.find(x=>x.id==id);if(!await ask(`Delete delivery note ${n.no}? This cannot be undone.`))return;await delRec('notes',id);go('#/notes')},
 pickc:()=>pick(S.customers,c=>{if(D.cust?.id!=c.id){D.address='';D.mapUrl=''}D.cust={id:c.id,name:c.name,phones:phOf(c)};view(true)},'Select customer…',t=>{RET={d:D,hash:location.hash};CPRE=t;go('#/c/new')}),
 pickd:()=>pick(S.items,x=>{let e=D.lines.find(l=>l.id==x.id);if(e)e.qty=r3(e.qty+1);else{e={lid:uid(),id:x.id,name:x.name,code:x.code,unit:x.unit,qty:1};D.lines.push(e)}D.hl=e.lid;view(true);$('.ln.new')?.scrollIntoView({block:'center',behavior:'smooth'})},'Search items…'),
 rm:(_,i)=>{D.lines.splice(i,1);view(true)},
 step:(_,i,s)=>{const el=$(`[data-q="${i}"]`),[mn,mx]=lim(el),v=r3(num(el.value)+ +s);if(v<mn||v>mx||(el.dataset.pos&&v<=0))return;setQ(i,v);el.value=v},
 all:()=>{const o=S.orders.find(x=>x.id==D.oid),n=S.notes.find(x=>x.id==D.id);o.lines.forEach(l=>D.qty[l.lid]=Math.max(0,r3(l.qty-aq(o.id,l.lid,n?.id))));view(true)},
 picka:()=>{if(!D.cust)return toast('Select a customer first.');const d=D,cid=d.cust.id,c=S.customers.find(x=>x.id==cid),l=(c?.addresses||[]).map((a,i)=>({id:i,name:a}));
  pick(l,x=>{d.address=x.name;d.mapUrl=lnkOf(c,x.name);view(true)},'Search or type an address…',async t=>{const a=cleanAddrs([t])[0];if(!a)return;d.address=a;d.mapUrl='';view(true);
   const cur=S.customers.find(x=>x.id==cid);if(!cur)return toast('Address set on this order only: customer record not found.',4000);
   if((cur.addresses||[]).some(x=>norm(x)==norm(a)))return;
   try{await put('customers',{...cur,addresses:[...(cur.addresses||[]),a]});toast('Address added to '+nm(cur))}catch(e){console.error(e);toast('Could not save the address to the customer: '+(e.message||e),6000)}},'Save new address','No saved addresses yet. Type one to add it.')},
 adrx:()=>{D.address='';D.mapUrl='';view(true)},
 mlink:async()=>{if(!D.cust)return toast('Select a customer first.');if(!D.address)return toast('Select a delivery address first.');
  const r=await linkInput(!!ordLink(D));if(!r)return;let rec;
  try{rec=await setLink(D.cust.id,D.address.trim(),r.url)}catch(e){console.error(e);return toast('Could not save the map link. Please try again.',3600)}
  D.mapUrl=r.url;view(true);toast(r.url?'Map link saved for '+nm(rec):'Map link removed')},
 mlinkc:async(_,i)=>{i=+i;if(!(CD.addresses[i]||'').trim())return toast('Enter the address first.');const r=await linkInput(!!CD.maps[i]);if(!r)return;CD.maps[i]=r.url;view(true);toast(r.url?'Map link added. Tap Save to keep it.':'Map link removed. Tap Save to keep the change.',3000)},
 gmap:()=>{const o=curOrd(),u=o&&ordLink(o);if(u)openMap(u)},
 gmapc:(_,i)=>{const c=S.customers.find(x=>x.id==location.hash.split('/')[2]),u=lnkOf(c,(c?.addresses||[])[+i]);if(u)openMap(u)},
 aadd:()=>{if(CD.addresses.length&&!CD.addresses[CD.addresses.length-1].trim()){$$('[data-ak]').pop()?.focus();return}CD.addresses.push('');CD.maps.push('');view(true);$$('[data-ak]').pop()?.focus()},
 adel:(_,i)=>{CD.addresses.splice(+i,1);CD.maps.splice(+i,1);view(true)},
 ocph:async()=>{if(!D?.cust)return;const c=S.customers.find(x=>x.id==D.cust.id);if(!c)return toast('Customer not found.');
  const n=await phInput();if(n==null)return;const cur=phOf(c),key=p=>libPh(p)||wd(p).replace(/[^\d+]/g,'');
  if(cur.some(p=>key(p)==n))return toast('This number is already saved for this customer.');
  const phones=[...cur,n],rec={...c,phones,phone:phones[0]||''},upd=S.orders.filter(o=>o.cust?.id==c.id).map(o=>({...o,cust:{...o.cust,phones}}));
  try{await bulkPut('customers',[rec]);if(upd.length)await bulkPut('orders',upd)}catch(e){return toast('Could not save the number. Please try again.',3600)}
  D.cust={...D.cust,phones};view(true);toast(`${n} added to ${nm(c)}`)},
 padd:()=>{if(CD.phones.length&&!CD.phones[CD.phones.length-1].trim()){$$('[data-pk]').pop()?.focus();return}CD.phones.push('');view(true);$$('[data-pk]').pop()?.focus()},
 pdel:(_,i)=>{CD.phones.splice(+i,1);view(true)},
 nnew:()=>{const l=S.orders.filter(canDN).map(o=>({id:o.id,name:o.cust.name,code:o.no}));l.length?pick(l,o=>go('#/n/new/'+o.id),'Select an open order…'):toast('No open orders to deliver.')},
 osave:async()=>{if(!D.cust)return toast('Select a customer.');if(!D.lines.length)return toast('Add at least one item.');if(D.lines.some(l=>!(l.qty>0)))return toast('Quantities must be above zero.');
  const old=S.orders.find(x=>x.id==D.id),rec={...(old||{}),id:D.id,no:old?.no,at:old?.at||new Date().toISOString(),closed:!!old?.closed,cust:{...D.cust,phones:S.customers.some(x=>x.id==D.cust.id)?phOf(S.customers.find(x=>x.id==D.cust.id)):D.cust.phones},address:(D.address||'').trim(),mapUrl:(D.address||'').trim()?(S.customers.some(x=>x.id==D.cust.id)?lnkOf(S.customers.find(x=>x.id==D.cust.id),D.address):(D.mapUrl||'')):'',note:D.note.trim(),lines:D.lines};
  const ppv=Math.round(num(D.pp)*100)/100;rec.pp=ppv>0?ppv:0;
  if(!old){rec.by=U.uid;delete rec.invoiceId;delete rec.conversionLock;await putNew('orders',rec,'ord','ORD-')}
  else{let r=await saveLive(rec,D,false);
   if(r.need){if(!await ask(`Financial edit detected. Invoice ${r.need} will be voided.`,'Save and void',''))return;r=await saveLive(rec,D,true)}
   if(!r.ok)return;if(r.cl)toast(`Financial edit detected. Invoice ${r.cl} voided.`,6000)}
  D=null;go('#/o/'+rec.id)},
 nsave:async()=>{const o=S.orders.find(x=>x.id==D.oid),old=S.notes.find(x=>x.id==D.id);
  {const cp=l=>Math.max(0,r3(l.qty-aq(o.id,l.lid,D.id))),ov=o.lines.filter(l=>(D.qty[l.lid]||0)>cp(l));if(ov.length){const t=ov.map(l=>nm(l)+' (now '+cp(l)+' available)').join(', ');ov.forEach(l=>D.qty[l.lid]=cp(l));await warn('Availability changed while you were editing: '+t+'. Quantities were adjusted. Review and tap Save again.');view(true);return}}
  const lines=o.lines.map(l=>({lid:l.lid,qty:Math.min(D.qty[l.lid]||0,r3(l.qty-aq(o.id,l.lid,D.id)))})).filter(x=>x.qty>0);if(!lines.length)return toast('Enter at least one delivered quantity.');
  const rec={...(old||{}),id:D.id,no:old?.no,orderId:o.id,at:old?.at||new Date().toISOString(),status:['loading','dispatched','delivered'].includes(D.status)?D.status:'loading',note:D.note.trim(),lines};
  if(old&&dnst(old)==rec.status&&(old.note||'')==rec.note&&old.lines.length==lines.length&&lines.every(x=>old.lines.find(y=>y.lid==x.lid)?.qty==x.qty)){D=null;return go('#/n/'+old.id)}
  if(!old){rec.by=U.uid;await putNew('notes',rec,'dn','DN-')}else await put('notes',rec);D=null;go('#/n/'+rec.id)},
 impbk:()=>pickBackup(),
 impf:(id,i,k)=>{IMPK=k;impf.value='';impf.click()},
 ce:id=>go('#/c/'+id+'/edit'),
 cpc:async id=>{const c=S.customers.find(x=>x.id==id)||S.orders.find(o=>o.cust?.id==id)?.cust;if(!c)return;const ok=await copyText(cpTxt(c));if(ok)$$('.cpy').forEach(h=>{if(h.dataset.id==id){h.classList.add('ok');setTimeout(()=>h.classList.remove('ok'),900)}});toast(ok?'Customer copied to clipboard':'Copy failed. Please try again.',ok?1800:2600)},
 expi:()=>{if(!S.items.length)return toast('No items to export.');const f=new File([JSON.stringify(S.items.map(x=>({id:x.id,code:x.code||'',name:x.name,unit:x.unit||''})),null,1)],'items.json',{type:'application/json'});dlFile(f);toast(f.name+' ('+S.items.length+')')},
 expc:()=>{const f=new File([JSON.stringify(S.customers.map(c=>({id:c.id,code:c.code||'',name:c.name,phones:phOf(c),phone:phOf(c)[0]||'',addresses:c.addresses||[],links:c.links||[]})),null,1)],'customers.json',{type:'application/json'}),u=URL.createObjectURL(f),a=document.createElement('a');a.href=u;a.download=f.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);toast(f.name)},
 cd:async id=>{const c=S.customers.find(x=>x.id==id),n=S.orders.filter(o=>o.cust.id==id).length;if(!await ask(`Delete customer "${nm(c)}"?${n?` Its ${n} existing order(s) keep the name but are no longer linked to a customer record.`:''} This cannot be undone.`))return;await delRec('customers',id);go('#/customers')},
 csave:async()=>{const name=wd(CD.name).trim(),code=wd(CD.code).trim(),phones0=cleanPh(CD.phones);if(!name)return toast('Enter the customer name.');
  const phones=[];for(const p of phones0){if((CD.ph0||[]).includes(p)){phones.push(p);continue}const v=libPh(p);if(!v){await warn(phMsg(p));return}phones.push(v)}phones.splice(0,phones.length,...cleanPh(phones));
  if(code&&S.customers.some(x=>x.id!=CD.id&&x.code==code))return toast('This code is already used by another customer.');
  const addrs=[],links=[],sA=new Set;CD.addresses.forEach((a,i)=>{const t=wd(a).replace(/\s+/g,' ').trim(),k=akey(t);if(!t||sA.has(k))return;sA.add(k);addrs.push(t);const u=CD.maps?.[i];if(u)links.push({a:t,u})});
  const old=S.customers.find(x=>x.id==CD.id),rec={...(old||{}),id:CD.id,code,name,phones,phone:phones[0]||'',addresses:addrs,links};await put('customers',rec);
  if(old&&(old.name!=name||JSON.stringify(phOf(old))!=JSON.stringify(phones))){const ro=S.orders.filter(o=>o.cust.id==rec.id).map(o=>({...o,cust:{...o.cust,name,phones}}));if(ro.length)await bulkPut('orders',ro)}
  {const oL=old?.links||[],keys=new Set([...links,...oL].map(l=>akey(l.a))),upd=[];for(const k of keys){const nu=lu(links,k),ou=lu(oL,k);if(nu==ou||(!nu&&!sA.has(k)))continue;for(const o of S.orders)if(o.cust?.id==rec.id&&akey(o.address)==k)upd.push({...o,mapUrl:nu})}if(upd.length)await bulkPut('orders',upd)}
  const r=RET;CD=null;if(r){D=r.d;if(D.cust?.id!=rec.id){D.address='';D.mapUrl=''}D.cust={id:rec.id,name,phones};RET=null;go(r.hash)}else go('#/c/'+rec.id)},
signin:()=>loginSheet(),signout:async()=>{const cnt=()=>inflight;
 const left=cnt(),msg=left?`${left} change(s) have not synced yet and will be lost if you switch now. Stay signed in until the status shows Synced.`:'Switch account? You will return to the login screen, and this phone will not keep the current account\'s data.';
 if(!await ask(msg,left?'Switch anyway':'Switch account'))return;
 try{await FB.signOut(fb.auth)}catch(e){console.warn(e)}await purgeLocal();try{localStorage.removeItem('dispatcher-uid')}catch(e){}location.reload()},
 exps:()=>{const f=dump(),u=URL.createObjectURL(f),a=document.createElement('a');a.href=u;a.download=f.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);toast(f.name)},
 wa:()=>shareView(),
 expsh:async()=>{const f=dump('.json.txt','text/plain');if(!navigator.canShare?.({files:[f]}))return toast('Sharing is not supported here. Use Export Data instead.');try{await navigator.share({files:[f],title:f.name})}catch(e){if(e.name!='AbortError')toast('Share failed ('+e.name+'). Use Export Data instead.')}}
};
const readText=f=>new Promise((ok,no)=>{const r=new FileReader(),t=setTimeout(()=>no(new Error('timed out reading the file')),10000);r.onload=()=>{clearTimeout(t);ok(String(r.result))};r.onerror=()=>{clearTimeout(t);no(r.error||new Error('read error'))};r.readAsText(f)});
async function impFile(k,f){if(needAdmin())return;let txt;toast('Reading '+f.name+'…',10000);try{txt=await readText(f)}catch(e){console.error(e);return toast('Could not read the file: '+(e.message||e),6000)}await(k=='backup'?impBackup(txt):k=='arccheck'?arcCheck(txt):imp(k,txt))}
const CKEY=['phone','phones','mobile','tel','telephone','addresses','address'],IKEY=['unit','uom','sku','barcode','price'],LBL={customers:'Customers',items:'Items'};
const hasK=(r,ks)=>ks.some(x=>Object.prototype.hasOwnProperty.call(r,x));
async function imp(k,txt){const bad=m=>toast(m,8000),other=k=='customers'?'items':'customers';let j;
 try{j=JSON.parse(String(txt).replace(/^\uFEFF/,''))}catch(e){return bad('This file is not valid JSON: '+e.message)}
 if(j&&typeof j=='object'&&!Array.isArray(j)){
  if(j.orders||j.deliveryNotes)return bad(`This is a full backup file, not a list of ${LBL[k].toLowerCase()}. Use Import Backup in Settings. Nothing was imported.`);
  if(!Array.isArray(j[k])&&!Array.isArray(j.data)&&Array.isArray(j[other]))return bad(`This file contains ${LBL[other]}, not ${LBL[k]}. Nothing was imported.`)}
 if(!Array.isArray(j))j=j?.[k]||j?.data;
 if(!Array.isArray(j))return bad('Expected a JSON list of records (or an object holding a "'+k+'" list). Nothing was imported.');
 const recs=j.filter(r=>r&&typeof r=='object'&&!Array.isArray(r));
 if(!recs.length)return bad('No records found in this file. Nothing was imported.');
 const nC=recs.filter(r=>hasK(r,CKEY)).length,nI=recs.filter(r=>hasK(r,IKEY)).length,mC=recs.filter(r=>hasK(r,CKEY)&&!hasK(r,IKEY)).length,mI=recs.filter(r=>hasK(r,IKEY)&&!hasK(r,CKEY)).length;
 if(k=='customers'&&mI)return bad(`${mI} of ${recs.length} records look like Items (unit or SKU fields, no phone or addresses). Wrong file? Nothing was imported.`);
 if(k=='items'&&mC)return bad(`${mC} of ${recs.length} records look like Customers (phone or address fields, no unit). Wrong file? Nothing was imported.`);
 const seen=new Set,rows=[];
 for(const r of recs){const name=wd(r.name).trim();if(!name)continue;const code=wd(r.code??r.sku),id=String(r.id??(code||(k=='customers'?uid():k[0]+rows.length)));if(seen.has(id))continue;seen.add(id);rows.push({id,code,name,...(k=='customers'?{ph:cleanPh(r.phones??r.phone),ad:r.addresses,lk:r.links}:{unit:wd(r.unit)})})}
 if(!rows.length)return bad(`No usable records: none of the ${j.length} entries has a name. Nothing was imported.`);
 const sure=k=='customers'?nC>0:nI>0,skip=j.length-rows.length,note=(skip?` ${skip} entries will be skipped (no name or duplicate ID).`:'')+(sure?'':` Could not confirm this is a ${LBL[k]} file (no ${k=='customers'?'phone or address':'unit'} fields). First record: ${rows[0].name}.`);
 try{if(k=='customers'){if(!await ask(`Add or update ${rows.length} customers from the file? Existing customers are kept.${note}`,'Import',''))return;await bulkPut('customers',rows.map(({id,code,name,ph,ad,lk})=>({id,code,name,phones:ph,phone:ph[0]||'',addresses:mergeA(id,ad),links:mergeL(id,lk)})));toast(`Imported ${rows.length} customers`);view(true);return}
 if(!await ask(`Replace ${S[k].length} records with ${rows.length} records from the file?${note}`,'Replace'))return;const at=new Date().toISOString();
 if(U)await replaceCloud(k,rows,at);else{await run([k,'meta'],o=>{o(k).clear();rows.forEach(r=>o(k).put(r));o('meta').put({k:k+'_at',v:at})});S[k]=rows;S.meta[k+'_at']=at}toast(`Imported ${rows.length} records`);view(true)}catch(e){console.error(e);toast('Import failed while saving: '+(e.message||e),6000)}}
/* ---- events ---- */
let IMPK=null;const impf=$('#impf');
impf.addEventListener('change',()=>{const f=impf.files[0],k=IMPK;if(f&&k)impFile(k,f).finally(()=>{impf.value=''})});
let SAV=false;const WRP=new Set(['ocph','oe','ne','oc','od','orel','nd','nnew','osave','nsave','ce','cd','csave','impbk','impf','arcgo','trr','trd','trempty','trbp','trbr']),WRA=new Set(['arcopen','trashopen','arcpre','arcexp','arcsave','arcshare','arcchk','trmore']),SAVEB=new Set(['osave','nsave','csave']);

/* ---- V9.0 share a view as an image (WhatsApp) ---- */
let H2I=null,WAB=0;const loadH2I=()=>H2I||(H2I=import('./h2i.js').catch(e=>{H2I=null;throw e}));
const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
function waBusy(on,msg){$('#wao')?.remove();if(!on)return;const d=document.createElement('div');d.id='wao';d.className='wao';d.setAttribute('role','status');d.innerHTML='<div class="wab"><i class="wasp" aria-hidden="true"></i><p></p></div>';d.querySelector('p').textContent=msg;document.body.append(d)}
function dlFile(f){const u=URL.createObjectURL(f),a=document.createElement('a');a.href=u;a.download=f.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000)}
function shareCap(){const[,h1,h2]=location.hash.split('/');if(h1=='c'){const p=phOf(S.customers.find(x=>x.id==h2));return p.length?`*Contact Numbers:*\n\n${p.map(x=>'• *'+x+'*').join('\n\n')}`:''}const o=curOrd(),p=o?(o.cust?.phones??phOf(S.customers.find(x=>x.id==o.cust?.id))):[],u=o?ordLink(o):'',parts=[];
 if(p.length)parts.push(`*Contact Numbers:*\n\n${p.map(x=>'• *'+x+'*').join('\n\n')}`);if(u)parts.push(`*Location:*\n${u}`);return parts.join('\n\n')}
async function waSend(f,text){try{await navigator.share({files:[f],title:f.name,...(text?{text}:{})})}catch(e){if(e.name=='AbortError')return;throw e}}
function waChoose(){return new Promise(r=>{const m=document.createElement('div');m.className='modal';m.innerHTML='<div class="box" role="dialog" aria-modal="true"><p><b>Share to WhatsApp</b></p><button class="btn" data-m="pdf">Send as document (PDF)</button><small class="hint">Full quality. WhatsApp does not compress documents.</small><button class="btn alt" data-m="img" style="margin-top:14px">Send as image</button><small class="hint">Quick preview in the chat, but WhatsApp compresses it.</small><div class="bt" style="margin-top:10px"><button data-m="">Cancel</button></div></div>';m.onclick=e=>{const v=e.target.dataset?.m;if(v!=null||e.target==m){m.remove();r(v||'')}};document.body.append(m)})}
/* Lossless single-page PDF: the snapshot is embedded as raw RGB pixels (Flate), page size = view size in points, so nothing is resampled or re-compressed */
async function mkPdf(cv,pr,name){const w=cv.width,h=cv.height;let px=cv.getContext('2d').getImageData(0,0,w,h).data,rgb=new Uint8Array(w*h*3);
 for(let i=0,j=0;i<px.length;i+=4){rgb[j++]=px[i];rgb[j++]=px[i+1];rgb[j++]=px[i+2]}px=null;
 let body,flt;
 if(typeof CompressionStream=='function'){body=new Uint8Array(await new Response(new Blob([rgb]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());flt='/Filter /FlateDecode'}
 else{const jb=await new Promise(r=>cv.toBlob(r,'image/jpeg',.97));body=new Uint8Array(await jb.arrayBuffer());flt='/Filter /DCTDecode'}
 rgb=null;const E=new TextEncoder(),parts=[],off=[];let pos=0;const push=u=>{parts.push(u);pos+=u.length};
 const o=(n,t,st)=>{off[n]=pos;push(E.encode(`${n} 0 obj\n${t}`));if(st){push(st);push(E.encode('\nendstream'))}push(E.encode('\nendobj\n'))};
 const pw=+(w/pr).toFixed(2),ph=+(h/pr).toFixed(2),ct=`q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
 push(E.encode('%PDF-1.4\n'));
 o(1,'<< /Type /Catalog /Pages 2 0 R >>');o(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 o(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
 o(4,`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 ${flt} /Length ${body.length} >>\nstream\n`,body);
 o(5,`<< /Length ${ct.length} >>\nstream\n${ct}`,new Uint8Array(0));
 const x=pos;push(E.encode('xref\n0 6\n0000000000 65535 f \n'+[1,2,3,4,5].map(n=>String(off[n]).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`));
 return new File(parts,name,{type:'application/pdf'})}
async function shareView(){if(WAB)return;WAB=1;const cap=shareCap(),mode=await waChoose();if(!mode){WAB=0;return}
 const el=$('#app'),nm0=($('#ti').textContent||'').replace(/[^\w-]+/g,'')||'Dispatcher',pdf=mode=='pdf';let f=null;
 waBusy(true,pdf?'Preparing document for WhatsApp...':'Preparing image for WhatsApp...');el.classList.add('snap');
 try{await frames();const{toCanvas}=await loadH2I();const h=el.scrollHeight,pr=Math.max(1,Math.min(2,12000/h));
  const cv=await toCanvas(el,{pixelRatio:pr,backgroundColor:getComputedStyle(document.body).backgroundColor,skipFonts:true,cacheBust:false});
  el.classList.remove('snap');const nm=`${nm0}-${stamp()}`;
  if(pdf)f=await mkPdf(cv,pr,nm+'.pdf');else{const b=await new Promise(r=>cv.toBlob(r,'image/png'));if(!b)throw new Error('empty');f=new File([b],nm+'.png',{type:'image/png'})}}
 catch(e){toast('Could not create the file ('+(e.name||'error')+'). Please try again.',3600)}
 finally{el.classList.remove('snap');waBusy(false)}
 try{if(!f)return;
  if(!navigator.canShare?.({files:[f]})){dlFile(f);return toast('Sharing is not supported here. File saved to downloads instead.',3600)}
  try{await waSend(f,cap)}
  catch(e){if(e.name=='NotAllowedError'){if(await ask('Your file is ready. Tap Share to send it.','Share',''))await waSend(f,cap)}else throw e}}
 catch(e){if(e.name!='AbortError')toast('Share failed ('+(e.name||'error')+').',3600)}
 finally{WAB=0}}
const isW=(a,b,c)=>(a=='o'||a=='n'||a=='c')&&(b=='new'||c=='edit');
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){e.preventDefault();const[a,b,c]=g.dataset.go.slice(2).split('/');if(isW(a,b,c)&&needPen())return;if((a=='archive'||a=='trash')&&needAdmin())return;return go(g.dataset.go)}const b=e.target.closest('[data-a]');if(b){const{a,id,i,s}=b.dataset;if(WRP.has(a)&&needPen())return;if(WRA.has(a)&&needAdmin())return;const r=ACT[a]?.(id,i,s);if(r&&r.then&&SAVEB.has(a)){const t=b.textContent;b.disabled=true;b.textContent='Saving…';r.finally(()=>{if(b.isConnected){b.disabled=false;b.textContent=t}})}}});
$('#fab').addEventListener('click',e=>{if(needAdmin())e.preventDefault()},true);
document.addEventListener('input',e=>{const el=e.target;if(el.tagName=='TEXTAREA')grow(el);if(el.id=='q'){Q=el.value;$('#list').innerHTML=LIST()}else if(el.dataset.q!=null){el.value=wd(el.value);const[mn,mx]=lim(el);setQ(el.dataset.q,Math.min(Math.max(num(el.value),mn),mx))}else if(el.dataset.k)D[el.dataset.k]=el.value;else if(el.dataset.ck)CD[el.dataset.ck]=el.value;else if(el.dataset.ak!=null)CD.addresses[+el.dataset.ak]=el.value;else if(el.dataset.pk!=null)CD.phones[+el.dataset.pk]=el.value});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.q!=null){const[mn,mx]=lim(el);el.value=Math.min(Math.max(num(el.value),mn),mx);setQ(el.dataset.q,+el.value)}});
const grow=el=>{el.style.height='auto';el.style.height=(el.scrollHeight+2)+'px'};
const setHH=()=>document.documentElement.style.setProperty('--hh',$('header').offsetHeight+'px');
const setSH=()=>document.documentElement.style.setProperty('--sh',($('.stk')?.offsetHeight||0)+'px');
addEventListener('resize',()=>{setHH();setSH()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
const isQ=el=>el&&el.dataset&&(el.dataset.q!=null||el.dataset.pp!=null);
document.addEventListener('input',e=>{const el=e.target;if(el.dataset&&el.dataset.pp!=null){let v=wd(el.value).replace(/٫/g,'.').replace(/,/g,'').replace(/[^\d.]/g,'');const i=v.indexOf('.');if(i>=0)v=v.slice(0,i+1)+v.slice(i+1).replace(/\./g,'').slice(0,2);if(el.value!==v)el.value=v}},true);
document.addEventListener('focusin',e=>{const el=e.target;if(isQ(el)){try{const n=el.value.length;el.setSelectionRange(n,n)}catch{}el.dataset.fresh='1'}});
document.addEventListener('focusout',e=>{if(isQ(e.target))delete e.target.dataset.fresh});
document.addEventListener('pointerdown',e=>{const el=e.target;if(isQ(el)&&el===document.activeElement)delete el.dataset.fresh},true);
document.addEventListener('beforeinput',e=>{const el=e.target;if(isQ(el)&&el.dataset.fresh){delete el.dataset.fresh;if(/^(insert|delete)/.test(e.inputType))el.value=''}});
document.addEventListener('contextmenu',e=>{if(isQ(e.target))e.preventDefault()});
/* ---- header tooltips ---- */
let tipEl=null,tipT=0,tipFor=null;
function hideTip(){clearTimeout(tipT);tipEl?.remove();tipEl=null;tipFor=null}
function showTip(b){hideTip();const t=document.createElement('div');t.className='tip';t.id='tip';t.setAttribute('role','tooltip');t.textContent=b.dataset.tip;document.body.append(t);
 const r=b.getBoundingClientRect(),w=t.offsetWidth,vw=document.documentElement.clientWidth,cx=r.left+r.width/2,left=Math.max(8,Math.min(cx-w/2,vw-w-8));
 t.style.left=left+'px';t.style.top=(r.bottom+8)+'px';t.style.setProperty('--ax',Math.max(12,Math.min(cx-left,w-12))+'px');
 requestAnimationFrame(()=>t.classList.add('on'));tipEl=t;tipFor=b;tipT=setTimeout(hideTip,2500)}
document.addEventListener('click',e=>{const b=e.target.closest('.ab');if(b){e.preventDefault();tipFor==b?hideTip():showTip(b)}else hideTip()},true);
addEventListener('scroll',hideTip,{passive:true});
addEventListener('hashchange',()=>view());
let SWPEND=false,RELOADING=false;
const idle=()=>!D&&!CD&&!$('.sheet,.modal')&&!document.activeElement?.matches('input,textarea');
const applyUpd=()=>{if(SWPEND&&!RELOADING&&idle()){RELOADING=true;location.reload()}};
function regSW(){if(!('serviceWorker'in navigator))return;const had=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!had)return;SWPEND=true;if(idle())applyUpd();else toast('Update installed. It applies when you finish editing.',4000)});
 navigator.serviceWorker.register('sw.js').then(r=>{document.addEventListener('visibilitychange',()=>{if(!document.hidden){r.update().catch(()=>{});applyUpd()}});addEventListener('hashchange',()=>setTimeout(applyUpd,80))}).catch(()=>{})}
/* ===== V13.1: Sales Invoice ID, Trash, Rolling Archive ===== */
const meName=()=>U?.email||'';
const isOnl=()=>!!U&&navigator.onLine;
const isSynced=()=>inflight==0&&!syncErr&&!rerr();
const tcol=()=>FB.collection(fb.db,'users',DR,'trash'),tdoc=id=>FB.doc(fb.db,'users',DR,'trash',id);
const canon=v=>JSON.stringify(v,(k,x)=>x&&typeof x=='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(q=>[q,x[q]])):x);
async function sha256(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dayStart=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3],0,0,0,0):null};
const askType=(msg,exp,ok='Delete permanently')=>new Promise(r=>{const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="box" role="alertdialog" aria-modal="true"><p>${esc(msg)}</p><input class="tcf" inputmode="numeric" autocomplete="off" placeholder="${esc(String(exp))}"><div class="bt"><button data-v="0">Cancel</button><button data-v="1" class="danger" disabled>${esc(ok)}</button></div></div>`;const i=$('.tcf',m),b=$('[data-v="1"]',m);i.addEventListener('input',()=>{b.disabled=wd(i.value).trim()!=String(exp)});m.onclick=e=>{const v=e.target.dataset?.v;if(e.target==b&&b.disabled)return;if(v!=null||e.target==m){m.remove();r(v=='1')}};document.body.append(m);i.focus()});

/* --- Sales Invoice ID: "INV-" + 1..4 digits, unique across live orders --- */
/* ===== V14.1: Invoicer prep. invoiceId / conversionLock are written by Invoicer; Dispatcher only preserves or clears them. ===== */
const lockedO=o=>!!(o&&o.conversionLock);
const lockedToast=()=>toast('This Order is being Converted to Invoice.',4500);
const appErr=(m,x)=>Object.assign(new Error(m),{app:1},x||{});
const stripO=o=>{const w={...o};delete w.invoiceId;delete w.conversionLock;return w};
const keepLive=r=>{const w=stripO(r),l=S.orders.find(x=>x.id==r.id);if(l&&l.invoiceId)w.invoiceId=l.invoiceId;if(l&&l.conversionLock)w.conversionLock=l.conversionLock;return w};
const finEdit=(so,D)=>!!so&&(so.cust?.id!=D.cust.id||(so.lines||[]).length!=D.lines.length||D.lines.some(l=>{const p=(so.lines||[]).find(x=>x.lid==l.lid);return!p||p.id!=l.id||p.qty!=l.qty}));
/* Order save: reads the live server copy inside the Pen transaction. Locked -> refuse. Stamped -> preserve, or clear (null) on a confirmed financial edit. */
async function saveLive(rec,D,ok){
 try{const out=await ptx(async tx=>{const r=cdoc('orders',rec.id),s=await tx.get(r),so=s.exists()?s.data():null;
   if(so&&so.conversionLock)throw appErr('locked',{locked:1});
   const w={...rec};delete w.invoiceId;delete w.conversionLock;let cl='';const st=so&&so.invoiceId;
   if(st){if(finEdit(so,D)){if(!ok)return{need:st};w.invoiceId=null;cl=st}else w.invoiceId=st}
   tx.set(r,w);return{w,cl}});
  if(out.need)return out;upsert(S.orders,out.w);return{ok:1,cl:out.cl}}
 catch(x){if(x&&x.locked)lockedToast();else if(!x?.pen)toast('Not saved. Please try again.',4000);return{fail:1}}}
const dupInv=()=>{const m=new Map();for(const o of S.orders){const k=String(o.invoiceId||'').trim().toUpperCase();if(!k)continue;if(!m.has(k))m.set(k,[]);m.get(k).push(o)}return[...m.values()].filter(a=>a.length>1)};

/* --- Counter guard: raise meta/counters to the current maximum and confirm, before any trash / delete / purge --- */
async function guardCounters(extra){
 if(!isAdm())return false;
 if(!navigator.onLine){toast('Deleting needs an internet connection, to keep order numbering safe.',6500);return false}
 fixCounters();const mo=Math.max(S.meta.ord,...(extra?.ord||[])),md=Math.max(S.meta.dn,...(extra?.dn||[]));
 try{const v=await ptx(async tx=>{const r=cdoc('meta','counters'),d=await tx.get(r),c=d.exists()?d.data():{},ord=Math.max(c.ord|0,mo),dn=Math.max(c.dn|0,md);tx.set(r,{ord,dn},{merge:true});return{ord,dn}});
  if(v.ord<mo||v.dn<md)throw new Error('counter mismatch');S.meta.ord=Math.max(S.meta.ord,v.ord);S.meta.dn=Math.max(S.meta.dn,v.dn);return true}
 catch(e){console.warn(e);if(e?.pen)return false;toast('Could not confirm the order counters with the server, so nothing was changed. Check your connection and try again.',6500);return false}}

/* --- Trash --- */
const entryOrder=(o,via,batch,now)=>{const notes=S.notes.filter(n=>n.orderId==o.id);return{b:{id:o.id,type:'order',no:o.no,name:cn(o),at:now,by:meName(),via,batch,order:stripO(o),notes},dels:[['orders',o.id],...notes.map(n=>['notes',n.id])]}};
const entryNote=(n,via,batch,now)=>{const o=S.orders.find(x=>x.id==n.orderId);return{b:{id:n.id,type:'note',no:n.no,name:o?cn(o):'',orderId:n.orderId||'',orderNo:o?.no||'',at:now,by:meName(),via,batch,note:n},dels:[['notes',n.id]]}};
const entryNums=(items,ex)=>{items.forEach(it=>{const b=it.b||it;if(b.type=='order'){ex.ord.push(seqOf(b.order||b));(b.notes||[]).forEach(n=>ex.dn.push(seqOf(n)))}else ex.dn.push(seqOf(b.note||b))});return ex};
async function commitTrash(items){let i=0,moved=0,stopped=false;
 while(i<items.length&&!stopped){const ops=[],take=[];let c=0;
  while(i<items.length){const it=items[i],w=1+it.dels.length;if(w>450){i++;continue}if(c+w>450)break;ops.push(['s',tdoc(it.b.id),it.b]);it.dels.forEach(([k,id])=>ops.push(['d',cdoc(k,id)]));c+=w;take.push(it);i++}
  if(!take.length)break;
  try{await wtx1(ops)}catch(e){console.warn(e);stopped=true;break}
  const rm={orders:new Set(),notes:new Set()};take.forEach(it=>it.dels.forEach(([k,id])=>rm[k].add(id)));
  S.orders=S.orders.filter(x=>!rm.orders.has(x.id));S.notes=S.notes.filter(x=>!rm.notes.has(x.id));moved+=take.length}
 return{moved,stopped,total:items.length}}
async function purgeEntries(list){if(!list.length)return{n:0};
 if(!await guardCounters(entryNums(list,{ord:[],dn:[]})))return{n:0,fail:true};
 let n=0;for(let i=0;i<list.length;i+=400){const part=list.slice(i,i+400);try{await wtx1(part.map(e=>['d',tdoc(e.id)]))}catch(e){console.warn(e);return{n,fail:true}}n+=part.length}
 return{n}}
async function restoreEntry(e){
 if(!isAdm())return{ok:false,msg:'Administrator privileges required.'};
 if(e.type=='order'){const o=e.order;
  if(S.orders.some(x=>x.id==e.id))return{ok:false,msg:`${e.no}: a live order with this ID already exists.`};
  const ns=(e.notes||[]).filter(n=>!S.notes.some(x=>x.id==n.id));
  if(ns.length+2>450)return{ok:false,msg:`${e.no}: too many delivery notes to restore in one step.`};
  const o2=stripO(o);try{await ptx(async tx=>{const sx=await tx.get(cdoc('orders',o2.id));if(sx.exists())throw appErr('exists',{exists:1});tx.set(cdoc('orders',o2.id),o2);ns.forEach(n=>tx.set(cdoc('notes',n.id),n));tx.delete(tdoc(e.id))})}catch(x){console.warn(x);return{ok:false,msg:x&&x.exists?`${e.no}: a live order with this ID already exists.`:`${e.no}: not restored (nothing was saved).`}}
  upsert(S.orders,o2);ns.forEach(n=>upsert(S.notes,n));return{ok:true,msg:`${e.no} restored`}}
 const n=e.note,p=S.orders.find(x=>x.id==n.orderId);
 if(!p)return{ok:false,msg:`${e.no}: its order (${e.orderNo||'unknown'}) is not in the app. Restore the order first.`};
 if(S.notes.some(x=>x.id==n.id))return{ok:false,msg:`${e.no}: a live delivery note with this ID already exists.`};
 for(const l of n.lines){const ol=p.lines.find(x=>x.lid==l.lid);if(!ol)return{ok:false,msg:`${e.no}: an item on this note is no longer on ${p.no}.`};const av=r3(ol.qty-aq(p.id,l.lid));if(l.qty>av)return{ok:false,msg:`${e.no}: ${nm(ol)} needs ${l.qty} but only ${av} available on ${p.no}.`}}
 try{await wtx1([['s',cdoc('notes',n.id),n],['d',tdoc(e.id)]])}catch(x){console.warn(x);return{ok:false,msg:`${e.no}: not restored (nothing was saved).`}}
 upsert(S.notes,n);return{ok:true,msg:`${e.no} restored`}}
let TRS={items:[],lim:50,unsub:null,ready:false,err:''};
function trashOpen(){if(TRS.unsub||!isAdm()||!fb)return;TRS.ready=false;TRS.err='';
 TRS.unsub=FB.onSnapshot(FB.query(tcol(),FB.orderBy('at','desc'),FB.limit(TRS.lim)),snap=>{TRS.items=snap.docs.map(d=>d.data());TRS.ready=true;if(location.hash=='#/trash')refresh()},e=>{TRS.err=e.code||'error';TRS.ready=true;if(location.hash=='#/trash')refresh()})}
function trashClose(){if(TRS.unsub){TRS.unsub();TRS.unsub=null;TRS.items=[];TRS.ready=false}}
async function trashSummary(){const set=t=>{const el=$('#trs');if(el)el.textContent=t};if(!$('#trs'))return;
 if(!isAdm())return set('Admin only');if(!isOnl())return set('Trash: available when online');
 try{const n=(await FB.getCountFromServer(tcol())).data().count;if(!n)return set('Trash is empty');
  const r=await FB.getDocs(FB.query(tcol(),FB.orderBy('at','asc'),FB.limit(1))),old=r.docs[0]?.data()?.at,d=old?Math.max(0,Math.floor((Date.now()-Date.parse(old))/864e5)):0;
  set(`Trash holds ${n} record${n==1?'':'s'}, oldest ${d} day${d==1?'':'s'}`)}catch(e){set('Trash: could not load')}}
const logState=(ids,state)=>{if(!ids.length)return;const h={};ids.forEach(id=>h[id]={state});wtx1([['s',cdoc('meta','archive'),{history:h},true]],1).catch(()=>{})};
async function inTrashIds(ids){const s=new Set();if(!isOnl())return s;try{for(let i=0;i<ids.length;i+=30){const r=await FB.getDocs(FB.query(tcol(),FB.where(FB.documentId(),'in',ids.slice(i,i+30))));r.docs.forEach(d=>s.add(d.id))}}catch(e){console.warn(e)}return s}

/* --- Rolling archive --- */
let ARC={cut:'',prev:null,exp:null,exported:false,ack:false,busy:false};
function arcPreview(cutD){const cutT=cutD.getTime(),nb=new Map();
 for(const n of S.notes){let a=nb.get(n.orderId);if(!a)nb.set(n.orderId,a=[]);a.push(n)}
 const ids=new Set(S.orders.map(o=>o.id)),r={elig:[],undeliv:0,recent:0,open:0,legacy:0,orphans:[],notes:0};
 for(const o of S.orders){if(!o.closed){r.open++;continue}
  const ns=nb.get(o.id)||[];if(ns.some(n=>dnst(n)!='delivered')){r.undeliv++;continue}
  let act=Math.max(Date.parse(o.at)||0,...ns.map(n=>Date.parse(n.at)||0));if(o.closedAt)act=Math.max(act,Date.parse(o.closedAt)||0);
  if(act>=cutT){r.recent++;continue}
  if(!o.closedAt)r.legacy++;r.elig.push(o);r.notes+=ns.length}
 for(const n of S.notes)if(!ids.has(n.orderId)&&(Date.parse(n.at)||0)<cutT)r.orphans.push(n);
 return r}
async function arcMakeExport(){const p=ARC.prev,nb=new Map();
 for(const n of S.notes){let a=nb.get(n.orderId);if(!a)nb.set(n.orderId,a=[]);a.push(n)}
 const orders=p.elig,notes=[],notesOf=new Map();orders.forEach(o=>{const ns=nb.get(o.id)||[];notesOf.set(o.id,ns.map(n=>n.id));ns.forEach(n=>notes.push(n))});
 const body={orders,deliveryNotes:notes,orphanNotes:p.orphans},sum=await sha256(JSON.stringify(body)),id=('arc-'+stamp()+'-'+String(uid()).slice(0,4)).replace(/[^A-Za-z0-9-]/g,'-');
 const doc={app:'dispatcher',kind:'archive',schema:2,archiveId:id,exportedAt:new Date().toISOString(),appVersion:APP_VER,exportedBy:meName(),cutoff:ARC.cut,counts:{orders:orders.length,deliveryNotes:notes.length,orphanNotes:p.orphans.length},counters:{ord:S.meta.ord,dn:S.meta.dn},checksum:sum,...body};
 const name=`dispatcher-archive-before-${ARC.cut}-${orders.length}orders-${stamp()}.json`,file=new File([JSON.stringify(doc,null,1)],name,{type:'application/json'});
 const sig=new Map();orders.forEach(o=>sig.set('o:'+o.id,canon(o)));notes.forEach(n=>sig.set('n:'+n.id,canon(n)));p.orphans.forEach(n=>sig.set('n:'+n.id,canon(n)));
 ARC.exp={id,file,name,size:file.size,sum,counts:doc.counts,sig,notesOf,orderIds:orders.map(o=>o.id),orphanIds:p.orphans.map(n=>n.id),cutoff:ARC.cut};ARC.exported=false;ARC.ack=false}
async function arcCheck(txt){let j;try{j=JSON.parse(String(txt).replace(/^\uFEFF/,''))}catch(e){return toast('Check failed: this file is not valid JSON.',6500)}
 if(!j||j.kind!=='archive')return toast('Check failed: this is not a Dispatcher archive file.',6500);
 const sum=await sha256(JSON.stringify({orders:j.orders||[],deliveryNotes:j.deliveryNotes||[],orphanNotes:j.orphanNotes||[]}));
 if(sum!==j.checksum)return toast('Check FAILED: the file contents do not match its checksum. Export again.',8000);
 const E=ARC.exp;if(E&&sum!==E.sum)return toast(`This is a valid archive, but not the one just exported (${sum.slice(0,8)} vs ${E.sum.slice(0,8)}).`,8000);
 toast(`✓ File is intact${E?' and matches this export':''}: ${(j.orders||[]).length} orders, ${(j.deliveryNotes||[]).length} notes, checksum ${sum.slice(0,8)}.`,8000)}
async function arcGo(){const E=ARC.exp;if(!E||!ARC.exported||!ARC.ack||ARC.busy)return;if(needAdmin())return;
 if(!isOnl()||!isSynced())return toast('Move to Trash needs an internet connection and everything synced. Wait until the status shows Synced.',6500);
 const om=new Map(S.orders.map(o=>[o.id,o])),nm2=new Map(S.notes.map(n=>[n.id,n])),nb=new Map();
 for(const n of S.notes){let a=nb.get(n.orderId);if(!a)nb.set(n.orderId,a=[]);a.push(n)}
 const items=[],now=new Date().toISOString();let changed=0,gone=0;
 for(const id of E.orderIds){const o=om.get(id);if(!o){gone++;continue}if(canon(o)!==E.sig.get('o:'+id)){changed++;continue}
  const ns=nb.get(id)||[],ex=E.notesOf.get(id)||[];if(ns.length!=ex.length||ns.some(n=>E.sig.get('n:'+n.id)!==canon(n))){changed++;continue}
  items.push(entryOrder(o,'archive',E.id,now))}
 for(const id of E.orphanIds){const n=nm2.get(id);if(!n){gone++;continue}if(canon(n)!==E.sig.get('n:'+id)||om.has(n.orderId)){changed++;continue}items.push(entryNote(n,'archive',E.id,now))}
 if(!items.length)return toast('Nothing to move: every exported record has changed since the export or is already gone.',7000);
 const cnt=it=>it.b.type=='order'?it.b.notes.length:1,tO=items.filter(i=>i.b.type=='order').length,tN=items.reduce((a,i)=>a+cnt(i),0);
 const sk=changed+gone?` ${changed+gone} exported record(s) changed or are gone and will be skipped.`:'';
 if(!await ask(`Move ${tO} orders and ${tN} delivery notes to Trash?${sk} They stay in Trash until you purge them.`,'Move to Trash',''))return;
 ARC.busy=true;view(true);
 if(!await guardCounters(entryNums(items,{ord:[],dn:[]}))){ARC.busy=false;view(true);return}
 const r=await commitTrash(items),done=items.slice(0,r.moved);
 if(r.moved){const dO=done.filter(i=>i.b.type=='order').length,dN=done.reduce((a,i)=>a+cnt(i),0);
  await wtx1([['s',cdoc('meta','archive'),{last:{id:E.id,at:now,by:meName(),cutoff:E.cutoff,orders:dO,notes:dN},history:{[E.id]:{at:now,by:meName(),cutoff:E.cutoff,orders:dO,notes:dN,state:'trashed'}}},true]],1).catch(()=>{})}
 ARC.busy=false;ARC.prev=null;ARC.exp=null;ARC.exported=false;ARC.ack=false;
 toast(r.stopped?`Stopped early: moved ${r.moved} of ${r.total} records. Check the connection and run the archive again.`:`Moved ${tO} orders and ${tN} delivery notes to Trash.`,7000);view(true)}

/* --- Screens --- */
function vArchive(){const E=ARC.exp,P=ARC.prev,def=ARC.cut||ymd(new Date(Date.now()-90*864e5)),why=[];
 let h=`<div class="card" style="--c:var(--pri)"><div class="cb" style="cursor:default"><h3>Archive old orders</h3><div class="m">Closed orders, with all their delivery notes, older than the cutoff are exported to a file you keep, then moved to Trash. Nothing is deleted until you purge the Trash.</div></div></div>`;
 h+=`<div class="sec">1 · Cutoff date</div><div class="card" style="--c:var(--line)"><div class="cb" style="cursor:default"><div class="fld"><label for="arcd">Archive orders closed before</label><input id="arcd" type="date" value="${def}"></div><button class="btn" data-a="arcpre">Preview</button></div></div>`;
 if(P){const ok=P.elig.length+P.orphans.length>0;
  h+=`<div class="sec">2 · Preview (before ${esc(ARC.cut)})</div><div class="card" style="--c:var(--fulfilled)"><div class="cb" style="cursor:default"><h3>${P.elig.length} orders · ${P.notes} delivery notes eligible</h3>${P.orphans.length?`<div class="m">+ ${P.orphans.length} orphan delivery note(s) (their order no longer exists)</div>`:''}<div class="m">Skipped: ${P.undeliv} closed with notes not yet Delivered · ${P.recent} closed but active on or after the cutoff · ${P.open} not closed (never archived)</div>${P.legacy?`<div class="m">${P.legacy} older closed order(s) have no closing date, so they are dated by their latest activity.</div>`:''}</div></div>`;
  h+=`<button class="btn" data-a="arcexp"${ok&&!ARC.busy?'':' disabled'}>Export archive file</button>`;
  if(!ok)h+=`<small class="hint">Nothing is eligible for this cutoff.</small>`}
 if(E){h+=`<div class="sec">3 · Save the file</div><div class="card" style="--c:var(--line)"><div class="cb" style="cursor:default"><div class="m" dir="ltr" style="word-break:break-all">${esc(E.name)}</div><div class="m">${(E.size/1024).toFixed(1)} KB · ${E.counts.orders} orders · ${E.counts.deliveryNotes} notes${E.counts.orphanNotes?` · ${E.counts.orphanNotes} orphan notes`:''}</div><div class="m">Checksum <b dir="ltr">${E.sum.slice(0,12)}</b></div><div class="seg" style="margin-top:10px"><button class="btn" data-a="arcsave">Save to phone</button><button class="btn alt" data-a="arcshare">Share</button></div><button class="btn alt" data-a="arcchk" style="margin-top:8px">Check saved file (optional)</button><small class="hint">Keep at least two copies (for example OneDrive). After the records are purged from Trash, this file is the only copy.</small></div></div>`;
  const rd=ARC.exported&&ARC.ack&&isOnl()&&isSynced()&&!ARC.busy;if(!ARC.exported)why.push('Save or share the file first.');if(!isOnl())why.push('You are offline.');else if(!isSynced())why.push('Wait until the status shows Synced.');if(ARC.exported&&!ARC.ack)why.push('Tick the box to continue.');
  h+=`<div class="sec">4 · Move to Trash</div><div class="card" style="--c:var(--line)"><div class="cb" style="cursor:default"><label class="ack"><input type="checkbox" id="arcack"${ARC.ack?' checked':''}${ARC.exported?'':' disabled'}><span>I saved the archive file and want to move these records to Trash.</span></label><button class="btn" data-a="arcgo"${rd?'':' disabled'}>${ARC.busy?'Moving…':'Move to Trash'}</button>${why.length&&!ARC.busy?`<small class="hint">${esc(why.join(' '))}</small>`:''}<small class="hint">Records edited after the export are skipped. You can restore from Trash until you purge it. Tell other admins before archiving.</small></div></div>`}
 const hist=Object.entries(S.arch?.history||{}).sort((a,b)=>String(b[1].at).localeCompare(String(a[1].at)));
 if(hist.length)h+=`<div class="sec">Archive history</div>`+hist.slice(0,10).map(([id,x])=>`<div class="card" style="--c:var(--line)"><div class="cb" style="cursor:default"><div class="m"><b>${fdt(x.at)}</b> · before ${esc(x.cutoff||'')} · ${x.orders||0} orders, ${x.notes||0} notes · ${esc(x.state||'')}</div></div></div>`).join('');
 return{t:'Archive',back:'#/settings',nav:'settings',html:h}}
function vTrash(){trashOpen();const it=TRS.items,batches=Object.entries(S.arch?.history||{}).filter(([,x])=>x.state=='trashed');
 let h=`<div class="card" style="--c:var(--closed)"><div class="cb" style="cursor:default"><h3>Trash</h3><div class="m" id="trs">Trash: checking…</div><div class="m">Deleted orders and delivery notes wait here. Restore them, or delete them forever.</div></div></div>`;
 h+=batches.map(([id,x])=>`<div class="card" style="--c:var(--pending)"><div class="cb" style="cursor:default"><div class="m"><b>Archive ${fdt(x.at)}</b> · before ${esc(x.cutoff||'')} · ${x.orders||0} orders, ${x.notes||0} notes</div><div class="seg" style="margin-top:8px"><button class="btn alt" data-a="trbr" data-id="${esc(id)}">Restore batch</button><button class="btn alt danger" data-a="trbp" data-id="${esc(id)}">Purge batch</button></div></div></div>`).join('');
 if(TRS.err)h+=`<p class="empty">Could not load Trash (${esc(TRS.err)}).</p>`;
 else if(!TRS.ready)h+=`<p class="empty">Loading…</p>`;
 else if(!it.length)h+=`<p class="empty">Trash is empty.</p>`;
 else h+=it.map(e=>`<article class="card" style="--c:var(--closed)"><div class="cb" style="cursor:default"><div class="r"><h3 dir="auto">${esc(e.no)} · ${esc(e.name||'')}</h3><span class="oc">${e.type=='order'?'Order':'Delivery note'}</span></div><div class="m">Deleted ${fdt(e.at)} by ${esc(e.by||'')}${e.via=='archive'?' · archive':''}</div><div class="m">${e.type=='order'?`${(e.notes||[]).length} delivery note(s)`:`Order ${esc(e.orderNo||'unknown')}`}</div></div><div class="ca"><button data-a="trr" data-id="${esc(e.id)}">Restore</button><button class="danger" data-a="trd" data-id="${esc(e.id)}">Delete forever</button></div></article>`).join('')+(it.length>=TRS.lim?`<button class="btn alt" data-a="trmore">Load more</button>`:'');
 if(it.length||TRS.ready)h+=`<button class="btn alt danger" data-a="trempty" style="margin-top:14px">Empty Trash</button>`;
 setTimeout(trashSummary,60);return{t:'Trash',back:'#/settings',nav:'settings',html:h}}
const pageDocs=async(q0)=>{const r=await FB.getDocs(q0);return r.docs.map(d=>d.data())};
async function purgeLoop(q0){let done=0;const seen=new Set();for(;;){const list=(await pageDocs(q0)).filter(e=>!seen.has(e.id));if(!list.length)break;list.forEach(e=>seen.add(e.id));const x=await purgeEntries(list);done+=x.n;if(x.fail)break}return done}
async function impArchive(j){const A=x=>Array.isArray(x)?x:[];
 const o=A(j.orders).filter(r=>r&&r.id&&r.no&&r.at&&r.cust&&Array.isArray(r.lines)),n=A(j.deliveryNotes).filter(r=>r&&r.id&&r.no&&r.at&&r.orderId&&Array.isArray(r.lines));
 if(!o.length)return toast('This archive file contains no orders.',6000);
 const liveO=new Set(S.orders.map(r=>r.id)),liveN=new Set(S.notes.map(r=>r.id)),tr=await inTrashIds([...o.map(r=>r.id),...n.map(r=>r.id)]);
 const sk={live:0,trash:0,inv:0,notes:0},take=[],tk=new Set(),used=new Map();
 for(const r of o){if(liveO.has(r.id)){sk.live++;continue}if(tr.has(r.id)){sk.trash++;continue}
  take.push(stripO(r));tk.add(r.id)}
 const nn=n.filter(r=>{if(liveN.has(r.id)||tr.has(r.id)||!tk.has(r.orderId)){sk.notes++;return false}return true});
 if(!take.length&&!nn.length)return toast(`Nothing to restore: ${sk.live} already in the app, ${sk.trash} in Trash.`,8000);
 const msg=`Restore ${take.length} orders and ${nn.length} delivery notes from this archive? Nothing in the app is overwritten. Skipped: ${sk.live} already in the app, ${sk.trash} in Trash.${isOnl()?'':' (Offline: Trash could not be checked.)'}`;
 try{if(!await ask(msg,'Restore',''))return;await bulkPut('orders',take);await bulkPut('notes',nn);fixCounters();syncCounters();toast(`Restored ${take.length} orders and ${nn.length} delivery notes from the archive.`,7000);view(true)}catch(e){console.error(e);toast('Archive restore failed while saving: '+(e.message||e),6500)}}
Object.assign(ACT,{
 oc:async id=>{if(lockedO(S.orders.find(x=>x.id==id)))return lockedToast();
  try{const w=await ptx(async tx=>{const r=cdoc('orders',id),s=await tx.get(r);if(!s.exists())throw appErr('gone');const so=s.data();if(so.conversionLock)throw appErr('locked',{locked:1});
    const n={...so};n.closed=!so.closed;if(n.closed)n.closedAt=new Date().toISOString();else delete n.closedAt;tx.set(r,n);return n});upsert(S.orders,w);view(true)}
  catch(x){if(x&&x.locked)lockedToast();else if(!x?.pen)toast('Not saved. Please try again.',4000)}},
 orel:async id=>{const o=S.orders.find(x=>x.id==id);if(!o||!o.conversionLock)return;
  if(!await ask(`Release the conversion lock on ${o.no}? Use this only if the invoice conversion was abandoned. Whoever is converting it must start again.`,'Release lock',''))return;
  try{const w=await ptx(async tx=>{const r=cdoc('orders',id),s=await tx.get(r);if(!s.exists())throw appErr('gone');const so=s.data();if(!so.conversionLock)return so;const n={...so,conversionLock:null};tx.set(r,n);return n});upsert(S.orders,w);toast('Conversion lock released.',3000);view(true)}
  catch(x){if(!x?.pen)toast('Could not release the lock. Please try again.',4000)}},
 od:async id=>{const o=S.orders.find(x=>x.id==id),n=S.notes.filter(x=>x.orderId==id);if(lockedO(o))return lockedToast();if(!await ask(`Move order ${o.no} to Trash? Its ${n.length} delivery note(s) go with it. You can restore it from Trash.${o.invoiceId?` It has Invoice ${o.invoiceId}; the link to it is removed when the order goes to Trash.`:''}`,'Move to Trash',''))return;
  if(!await guardCounters({ord:[seqOf(o)],dn:n.map(seqOf)}))return;const r=await commitTrash([entryOrder(o,'manual','',new Date().toISOString())]);if(r.moved){toast(`${o.no} moved to Trash`);go('#/orders')}else toast('The move did not complete. Check the connection and try again.',6000)},
 nd:async id=>{const n=S.notes.find(x=>x.id==id);if(!await ask(`Move delivery note ${n.no} to Trash? You can restore it from Trash.`,'Move to Trash',''))return;
  if(!await guardCounters({dn:[seqOf(n)]}))return;const r=await commitTrash([entryNote(n,'manual','',new Date().toISOString())]);if(r.moved){toast(`${n.no} moved to Trash`);go('#/notes')}else toast('The move did not complete. Check the connection and try again.',6000)},
 arcopen:()=>go('#/archive'),trashopen:()=>go('#/trash'),
 arcpre:()=>{const d=dayStart($('#arcd')?.value);if(!d)return toast('Pick a valid cutoff date.');ARC.cut=ymd(d);ARC.prev=arcPreview(d);ARC.exp=null;ARC.exported=false;ARC.ack=false;view(true)},
 arcexp:async()=>{const P=ARC.prev;if(!P||!(P.elig.length+P.orphans.length))return;toast('Preparing archive…',20000);try{await arcMakeExport();toast('Archive file ready. Save or share it.')}catch(e){console.error(e);toast('Could not prepare the archive: '+(e.message||e),6500)}view(true)},
 arcsave:()=>{if(!ARC.exp)return;dlFile(ARC.exp.file);ARC.exported=true;toast(ARC.exp.name,5000);view(true)},
 arcshare:async()=>{const E=ARC.exp;if(!E)return;const f=new File([E.file],E.name+'.txt',{type:'text/plain'});if(!navigator.canShare?.({files:[f]}))return toast('Sharing is not supported here. Use Save to phone instead.');try{await navigator.share({files:[f],title:E.name});ARC.exported=true;view(true)}catch(e){if(e.name!='AbortError')toast('Share failed ('+e.name+'). Use Save to phone instead.')}},
 arcchk:()=>{IMPK='arccheck';impf.value='';impf.click()},
 arcgo:()=>arcGo(),
 trmore:()=>{TRS.lim+=50;trashClose();view(true)},
 trr:async id=>{const e=TRS.items.find(x=>x.id==id);if(!e)return;const r=await restoreEntry(e);toast(r.msg,6500)},
 trd:async id=>{const e=TRS.items.find(x=>x.id==id);if(!e)return;if(!await ask(`Permanently delete ${e.no}? This cannot be undone.`,'Delete forever'))return;const r=await purgeEntries([e]);if(r.n)toast(`${e.no} deleted permanently`)},
 trempty:async()=>{if(!isOnl())return toast('Emptying the Trash needs an internet connection.',6000);let n=0;try{n=(await FB.getCountFromServer(tcol())).data().count}catch(e){return toast('Could not count the Trash. Try again.',6000)}
  if(!n)return toast('Trash is already empty.');if(!await askType(`Permanently delete all ${n} record(s) in Trash? This cannot be undone. Type ${n} to confirm.`,n))return;
  toast('Emptying Trash…',60000);const d=await purgeLoop(FB.query(tcol(),FB.limit(100)));logState(Object.entries(S.arch?.history||{}).filter(([,x])=>x.state=='trashed').map(([k])=>k),'purged');toast(`Deleted ${d} record(s) permanently.`,6000)},
 trbp:async id=>{if(!isOnl())return toast('Purging needs an internet connection.',6000);const q0=()=>FB.query(tcol(),FB.where('batch','==',id),FB.limit(100));let n=0;try{n=(await FB.getCountFromServer(FB.query(tcol(),FB.where('batch','==',id)))).data().count}catch(e){return toast('Could not count the batch. Try again.',6000)}
  if(!n){logState([id],'purged');return toast('This batch is already empty.')}if(!await askType(`Permanently delete the ${n} record(s) of this archive batch? This cannot be undone. Type ${n} to confirm.`,n))return;
  toast('Purging batch…',60000);const d=await purgeLoop(q0());if(d>=n)logState([id],'purged');toast(`Deleted ${d} record(s) permanently.`,6000)},
 trbr:async id=>{if(!isOnl())return toast('Restoring a batch needs an internet connection.',6000);toast('Restoring batch…',60000);let ok=0,bad=0,first='';const seen=new Set();
  for(;;){const list=(await pageDocs(FB.query(tcol(),FB.where('batch','==',id),FB.limit(100)))).filter(e=>!seen.has(e.id));if(!list.length)break;list.sort((a,b)=>(a.type=='order'?0:1)-(b.type=='order'?0:1));
   for(const e of list){seen.add(e.id);const r=await restoreEntry(e);if(r.ok)ok++;else{bad++;if(!first)first=r.msg}}}
  if(!bad)logState([id],'restored');toast(`Restored ${ok} record(s).${bad?` ${bad} could not be restored. First problem: ${first}`:''}`,9000)}
});
Object.assign(ACT,{
 penpass:async()=>{if(needPen())return;const e=await penPicker();if(!e)return;try{await passPen(e);toast(`The Pen was passed to ${nameOf(e)}.`,4000)}catch(x){if(!x?.pen)toast('Could not pass the Pen.',4000)}},
 penover:async()=>{if(needAdmin()||holdsPen())return;if(!await ask(`Take the Pen from ${LEASE?.name||'the current holder'}? Radio them first. They lose it immediately, and any unsaved work on their screen is lost.`,'Take the Pen',''))return;
  try{await takePen('override');toast('You now hold the Pen.',3500)}catch(x){if(!x?.pen)toast('Could not take the Pen.',4000)}},
 penreset:async()=>{if(needAdmin()||U.uid!==ADMIN_UID)return;if(!await ask('Reset the Pen to your account? Use this only if the Pen is stuck or damaged.','Reset Pen',''))return;
  try{await takePen('reset');toast('The Pen was reset. You hold it now.',4000)}catch(x){if(!x?.pen)toast('Could not reset the Pen.',4000)}}
});
document.addEventListener('change',e=>{if(e.target.id=='arcack'){ARC.ack=e.target.checked;view(true)}});
/* ===== end V13.1 / V14.0 ===== */

for(const k of['osave','nsave']){const f=ACT[k];ACT[k]=async(...a)=>{if(SAV)return;SAV=true;try{return await f(...a)}finally{SAV=false}}}
(async()=>{fixCounters();view();navigator.storage?.persist?.().then(g=>{persisted=g}).catch(()=>{});sync();addEventListener('online',()=>{sync();syncCounters();setTimeout(repairDups,800)});addEventListener('offline',sync);authInit();regSW()})();
