// admin-core.js — Auth, overview, members, sub-admins

import{initializeApp}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import{getAuth,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import{getFirestore,collection,doc,setDoc,getDoc,getDocs,addDoc,updateDoc,deleteDoc,query,where,limit,serverTimestamp}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const cfg={apiKey:"AIzaSyCnX9DszicduSwsFwBZ_iTLI47NPeXkteE",authDomain:"iconik-global.firebaseapp.com",projectId:"iconik-global",storageBucket:"iconik-global.firebasestorage.app",messagingSenderId:"1040054516979",appId:"1:1040054516979:web:33cd5f07ae8fc146a30b86"};
const ADMIN_EMAIL="iconikglobal01@gmail.com";
const fb=initializeApp(cfg),auth=getAuth(fb),db=getFirestore(fb);

// Safe fetch
async function sg(ref){
  try{return await Promise.race([getDocs(ref),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),5000))]);}
  catch(e){console.warn('Firestore:',e.message);return{empty:true,forEach:()=>{},docs:[],size:0};}
}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function toast(msg,type){
  var t=document.getElementById('toast');
  t.textContent=msg;
  t.style.background=type==='error'?'rgba(127,29,29,0.95)':type==='info'?'rgba(30,58,95,0.95)':'rgba(20,83,45,0.95)';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}
window.toast=toast;

// Sign out
window._signOut=async function(){
  await signOut(auth);
  location.replace('/app.html?signout=1');
};

// Cloudinary upload
async function uploadFile(file){
  const fd=new FormData();
  fd.append('file',file);
  fd.append('upload_preset','iconik_uploads');
  const r=await fetch('https://api.cloudinary.com/v1_1/dhazrf2xr/upload',{method:'POST',body:fd});
  if(!r.ok)throw new Error('Upload failed — make sure iconik_uploads preset is set to Unsigned in Cloudinary');
  return(await r.json()).secure_url;
}

// Preview uploaded image
window.previewImg=function(input,previewId){
  const file=input.files[0];if(!file)return;
  const prev=document.getElementById(previewId);
  const reader=new FileReader();
  reader.onload=e=>{prev.src=e.target.result;prev.style.display='block';};
  reader.readAsDataURL(file);
};

let allMembers=[];

// ── AUTH GUARD ──
onAuthStateChanged(auth,async u=>{
  if(!u){location.replace('/app.html');return;}
  try{
    const d=await getDoc(doc(db,'users',u.uid));
    const data=d.exists()?d.data():{};
    const allowed=['admin','Sub Admin','Moderator','Content Manager'];
    if(u.email!==ADMIN_EMAIL&&!allowed.includes(data.role)){
      alert('Access denied. Admin only.');
      location.replace('/dashboard.html');
      return;
    }
    document.getElementById('adminNameEl').textContent=data.name||u.email;
  }catch(e){console.error(e);}
  // Load all sections
  load_overview();
  load_members();
  load_managecelebs();
  load_posts();
  load_news();
  load_events();
  load_messages();
  load_polls();
  load_subadmins();
});

// ── OVERVIEW ──
window.load_overview=async function(){
  try{
    const[ms,cs,ps]=await Promise.all([
      sg(query(collection(db,'users'),limit(200))),
      sg(query(collection(db,'celebrities'),limit(200))),
      sg(query(collection(db,'posts'),limit(200)))
    ]);
    document.getElementById('statMembers').textContent=ms.size||0;
    document.getElementById('statCelebs').textContent=cs.size||0;
    document.getElementById('statPosts').textContent=ps.size||0;
    let pending=0;ms.forEach(d=>{if((d.data().verificationStatus||'pending')==='pending')pending++;});
    document.getElementById('statPending').textContent=pending;
    // Recent members
    const recent=[];ms.forEach(d=>recent.push({id:d.id,...d.data()}));
    recent.sort((a,b)=>(b.joinedAt?.seconds||0)-(a.joinedAt?.seconds||0));
    document.getElementById('recentMembersList').innerHTML=recent.slice(0,5).map(m=>memberRow(m,true)).join('')||'<div style="color:var(--muted);font-size:0.72rem;padding:10px;">No members yet.</div>';
    attachMemberActions();
  }catch(e){console.error(e);}
};

// ── MEMBERS ──
window.load_members=async function(){
  const el=document.getElementById('membersList');
  const snap=await sg(query(collection(db,'users'),limit(100)));
  allMembers=[];snap.forEach(d=>allMembers.push({id:d.id,...d.data()}));
  allMembers.sort((a,b)=>(b.joinedAt?.seconds||0)-(a.joinedAt?.seconds||0));
  renderMembers(allMembers);
};

function renderMembers(list){
  const el=document.getElementById('membersList');
  if(!list.length){el.innerHTML='<div style="color:var(--muted);font-size:0.72rem;padding:10px;">No members found.</div>';return;}
  el.innerHTML=list.map(m=>memberRow(m,false)).join('');
  attachMemberActions();
}

function memberRow(m,compact){
  const nm=esc(m.name||'Member');
  const status=m.verificationStatus||'pending';
  const badgeCls=status==='verified'?'badge-ok':status==='rejected'?'badge-err':'badge-warn';
  const photo=m.profilePic&&m.profilePic.startsWith('http')?`<img src="${esc(m.profilePic)}" onerror="this.remove()"/>`:''
  const isBanned=m.banned===true;
  return`<div class="m-row">
    <div class="m-av">${photo}${nm.charAt(0)}</div>
    <div style="flex:1;min-width:0;">
      <div class="m-name">${nm} <span class="badge ${badgeCls}">${status}</span>${isBanned?'<span class="badge badge-err" style="margin-left:3px;">BANNED</span>':''}</div>
      <div class="m-meta">${compact?esc(m.country||'—'):esc(m.email||'')+'&nbsp;·&nbsp;'+esc(m.country||'—')+'&nbsp;·&nbsp;'+esc(m.tier||'Fan')}</div>
    </div>
    <div class="m-actions">
      ${status!=='verified'?`<button class="m-btn m-btn-ok" data-action="verify" data-uid="${m.id}" title="Verify">✓</button>`:''}
      ${status==='verified'?`<button class="m-btn m-btn-warn" data-action="unverify" data-uid="${m.id}" title="Remove verification">↩</button>`:''}
      <button class="m-btn m-btn-info" data-action="vip" data-uid="${m.id}" data-tier="${esc(m.tier||'Fan')}" title="Change tier">VIP</button>
      ${isBanned
        ?`<button class="m-btn m-btn-ok" data-action="unban" data-uid="${m.id}" data-name="${nm}" title="Unban">🔓</button>`
        :`<button class="m-btn m-btn-warn" data-action="ban" data-uid="${m.id}" data-name="${nm}" title="Ban">🚫</button>`}
      <button class="m-btn m-btn-err" data-action="delete" data-uid="${m.id}" title="Delete">🗑</button>
    </div>
  </div>`;
}

function attachMemberActions(){
  document.querySelectorAll('[data-action]').forEach(btn=>{
    btn.onclick=async function(){
      const{action,uid,tier,name}=this.dataset;
      if(action==='verify'){
        await updateDoc(doc(db,'users',uid),{verificationStatus:'verified'});
        toast('Member verified! ✅');load_members();load_overview();
      }else if(action==='unverify'){
        await updateDoc(doc(db,'users',uid),{verificationStatus:'pending'});
        toast('Verification removed');load_members();
      }else if(action==='vip'){
        const t=prompt('Set tier:',tier||'Fan');
        if(t){await updateDoc(doc(db,'users',uid),{tier:t});toast('Tier updated: '+t);load_members();}
      }else if(action==='ban'){
        if(confirm('Ban '+name+'? They will lose access to ICONIK.')){
          await updateDoc(doc(db,'users',uid),{banned:true,banDate:serverTimestamp()});
          toast(name+' banned 🚫');load_members();
        }
      }else if(action==='unban'){
        await updateDoc(doc(db,'users',uid),{banned:false,banDate:null});
        toast(name+' access restored ✅');load_members();
      }else if(action==='delete'){
        if(confirm('Delete this member? Cannot be undone.')){
          await deleteDoc(doc(db,'users',uid));toast('Member removed');load_members();load_overview();
        }
      }
    };
  });
}

window.searchMembers=function(){
  const q=document.getElementById('memberSearch').value.toLowerCase();
  renderMembers(q?allMembers.filter(m=>m.name?.toLowerCase().includes(q)||m.email?.toLowerCase().includes(q)):allMembers);
};
window.filterStatus=function(s){
  renderMembers(s==='all'?allMembers:allMembers.filter(m=>(m.verificationStatus||'pending')===s));
};

// ── CELEBRITIES ── (FULL EDIT/DELETE/PHOTO FIX)
// ── ALL CELEBS CACHE ──
let _allCelebsCache=[];

// ── LOAD & CACHE CELEBRITIES ──
async function fetchAllCelebs(){
  const snap=await sg(query(collection(db,'celebrities'),limit(100)));
  _allCelebsCache=[];
  snap.forEach(d=>_allCelebsCache.push({id:d.id,...d.data()}));
  return _allCelebsCache;
}

// ── MANAGE CELEBRITIES VIEW ──
window.load_celebrities=async function(){
  await fetchAllCelebs();
  renderManageCelebs(_allCelebsCache);
};

window.load_managecelebs=async function(){
  await fetchAllCelebs();
  renderManageCelebs(_allCelebsCache);
};

function renderManageCelebs(celebs){
  const el=document.getElementById('manageCelebsList');
  if(!el)return;
  // Update photo status counters
  const withPhoto=celebs.filter(c=>{const u=c.photo||c.photoUrl||c.imageUrl||c.profilePic||c.coverPhoto||'';return u&&u.startsWith('http');}).length;
  const noPhoto=celebs.length-withPhoto;
  const wp=document.getElementById('celebWithPhoto');
  const np=document.getElementById('celebNoPhoto');
  if(wp)wp.textContent=withPhoto;
  if(np)np.textContent=noPhoto;

  if(!celebs.length){
    el.innerHTML='<div style="color:var(--muted);font-size:0.72rem;padding:14px;text-align:center;">No celebrities yet. <button onclick="goView(\'celebrities\')" style="color:var(--gold);background:none;border:none;cursor:pointer;font-weight:700;">Add your first icon →</button></div>';
    return;
  }

  el.innerHTML=celebs.map(c=>{
    const photoUrl=c.photo||c.photoUrl||c.imageUrl||c.profilePic||c.coverPhoto||'';
    const hasPhoto=photoUrl&&photoUrl.startsWith('http');
    const nm=esc(c.name||'?');
    const stage=c.stageName?` <span style="font-size:0.56rem;color:var(--muted);font-style:italic;">"${esc(c.stageName)}"</span>`:'';

    // Avatar with real photo or initial
    const photoHTML=hasPhoto
      ?`<img src="${esc(photoUrl)}" alt="${nm}" loading="lazy" crossorigin="anonymous"
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top center;border-radius:50%;"
           onerror="this.style.display='none';"/>`
      :'';

    // Photo status indicator
    const photoStatus=hasPhoto
      ?`<div style="display:flex;align-items:center;gap:4px;margin-top:3px;">
          <div style="width:7px;height:7px;border-radius:50%;background:var(--ok);flex-shrink:0;"></div>
          <span style="font-family:'Montserrat',sans-serif;font-size:0.52rem;color:var(--ok);">Photo ✓</span>
        </div>`
      :`<div style="display:flex;align-items:center;gap:4px;margin-top:3px;">
          <div style="width:7px;height:7px;border-radius:50%;background:var(--err);flex-shrink:0;"></div>
          <span style="font-family:'Montserrat',sans-serif;font-size:0.52rem;color:var(--err);">⚠ No photo — tap ✏️ Edit to add</span>
        </div>`;

    return`<div class="m-row" style="align-items:center;flex-wrap:wrap;gap:8px;padding:12px;margin-bottom:8px;border-left:3px solid ${hasPhoto?'var(--ok)':'var(--err)'};">
      <div class="m-av" style="position:relative;overflow:hidden;flex-shrink:0;width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold2));display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:1.1rem;color:var(--bg);">
        ${photoHTML}
        <span style="position:relative;z-index:0;">${nm.charAt(0)}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div class="m-name" style="font-size:0.74rem;">${nm}${stage}</div>
        <div class="m-meta">${esc(c.category||'—')} · ${esc(c.country||'—')} · ${esc(c.followers||'—')}</div>
        ${photoStatus}
      </div>
      <div style="display:flex;gap:5px;flex-shrink:0;">
        <button class="m-btn m-btn-warn" onclick="editCeleb('${c.id}')">✏️ Edit</button>
        <button class="m-btn m-btn-err" onclick="deleteCeleb('${c.id}','${nm}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}

// Filter by photo status
window.filterCelebMgmt=function(filter,btn){
  document.querySelectorAll('#celebFilterBtns button').forEach(b=>b.style.fontWeight='400');
  if(btn)btn.style.fontWeight='800';
  const q=(document.getElementById('celebMgmtSearch')||{}).value||'';
  let list=_allCelebsCache;
  if(q)list=list.filter(c=>(c.name||'').toLowerCase().includes(q.toLowerCase())||(c.category||'').toLowerCase().includes(q.toLowerCase()));
  if(filter==='nophoto')list=list.filter(c=>{const u=c.photo||c.photoUrl||c.imageUrl||'';return!u||!u.startsWith('http');});
  if(filter==='photo')list=list.filter(c=>{const u=c.photo||c.photoUrl||c.imageUrl||'';return u&&u.startsWith('http');});
  renderManageCelebs(list);
};

window.searchCelebMgmt=function(){
  const q=(document.getElementById('celebMgmtSearch')||{}).value||'';
  const list=_allCelebsCache.filter(c=>
    (c.name||'').toLowerCase().includes(q.toLowerCase())||
    (c.category||'').toLowerCase().includes(q.toLowerCase())||
    (c.stageName||'').toLowerCase().includes(q.toLowerCase())
  );
  renderManageCelebs(list);
};

// Live photo URL preview
window.previewPhotoUrl=function(url){
  const wrap=document.getElementById('cPhotoPreviewWrap');
  const img=document.getElementById('cPhotoLivePreview');
  if(!wrap||!img)return;
  if(url&&url.startsWith('http')){
    img.src=url;
    img.onload=function(){wrap.style.display='flex';};
    img.onerror=function(){wrap.style.display='none';};
  } else {
    wrap.style.display='none';
  }
};

// ── EDIT CELEBRITY ──
window.editCeleb=async function(celebId){
  try{
    const d=await getDoc(doc(db,'celebrities',celebId));
    if(!d.exists()){toast('Celebrity not found','error');return;}
    const c={id:d.id,...d.data()};
    // Navigate to add/edit form first
    goView('celebrities');
    setTimeout(async()=>{
      document.getElementById('cName').value=c.name||'';
      document.getElementById('cStage').value=c.stageName||'';
      document.getElementById('cCat').value=c.category||'';
      document.getElementById('cCountry').value=c.country||'';
      document.getElementById('cFollowers').value=c.followers||'';
      document.getElementById('cBio').value=c.bio||'';
      const photoUrl=c.photo||c.photoUrl||c.imageUrl||'';
      document.getElementById('cPhotoUrl').value=photoUrl;
      document.getElementById('cStatus').value=c.status||'Active';
      // Show live preview if photo exists
      if(photoUrl){
        previewPhotoUrl(photoUrl);
        const prev=document.getElementById('cPreview');
        if(prev){prev.src=photoUrl;prev.style.display='block';}
      }
      // Switch to Update mode
      const btn=document.getElementById('addCelebBtn');
      btn.textContent='💾 Save Changes →';
      btn.style.background='linear-gradient(135deg,#22C55E,#16A34A)';
      btn.onclick=function(){updateCeleb(celebId);};
      toast('✏️ Editing '+c.name+' — update fields and tap Save','info');
      document.getElementById('cName').scrollIntoView({behavior:'smooth',block:'start'});
    },100);
  }catch(e){toast('Error loading celebrity','error');console.error(e);}
};

window.updateCeleb=async function(celebId){
  const btn=document.getElementById('addCelebBtn');
  const name=document.getElementById('cName').value.trim();
  const cat=document.getElementById('cCat').value;
  if(!name||!cat){toast('Name and category are required','error');return;}
  btn.disabled=true;btn.textContent='Saving...';
  try{
    let photo=document.getElementById('cPhotoUrl').value.trim();
    const file=document.getElementById('cPhotoFile').files[0];
    if(file&&!photo){photo=await uploadFile(file);}
    // Save photo to ALL possible fields so dashboard always finds it
    await setDoc(doc(db,'celebrities',celebId),{
      name,
      stageName:document.getElementById('cStage').value.trim(),
      category:cat,
      country:document.getElementById('cCountry').value.trim(),
      followers:document.getElementById('cFollowers').value.trim(),
      bio:document.getElementById('cBio').value.trim(),
      photo:photo,
      photoUrl:photo,
      imageUrl:photo,
      profilePic:photo,
      status:document.getElementById('cStatus').value,
      updatedAt:serverTimestamp()
    },{merge:true});
    toast(name+' updated! ✅ Photo saved to all fields.');
    // Reset form to Add mode
    ['cName','cStage','cCountry','cFollowers','cBio','cPhotoUrl'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('cCat').value='';
    const prev=document.getElementById('cPreview');
    if(prev)prev.style.display='none';
    const wrap=document.getElementById('cPhotoPreviewWrap');
    if(wrap)wrap.style.display='none';
    btn.textContent='Add Celebrity →';
    btn.style.background='';
    btn.onclick=function(){addCeleb();};
    // Refresh manage view and go back to it
    await fetchAllCelebs();
    goView('managecelebs');
  }catch(e){toast(e.message||'Error updating','error');}
  btn.disabled=false;
};
