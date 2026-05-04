// admin-features.js — Celebrities, posts, events, magazine

window.addCeleb=async function(){
  const btn=document.getElementById('addCelebBtn');
  const name=document.getElementById('cName').value.trim();
  const cat=document.getElementById('cCat').value;
  if(!name||!cat){toast('Name and category are required','error');return;}
  btn.disabled=true;btn.textContent='Adding...';
  try{
    let photo=document.getElementById('cPhotoUrl').value.trim();
    const file=document.getElementById('cPhotoFile').files[0];
    if(file&&!photo){photo=await uploadFile(file);}
    await addDoc(collection(db,'celebrities'),{
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
      createdAt:serverTimestamp()
    });
    toast(name+' added! ⭐');
    ['cName','cStage','cCountry','cFollowers','cBio','cPhotoUrl'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('cCat').value='';
    const prev=document.getElementById('cPreview');
    if(prev)prev.style.display='none';
    const wrap=document.getElementById('cPhotoPreviewWrap');
    if(wrap)wrap.style.display='none';
    await fetchAllCelebs();
    goView('managecelebs');
  }catch(e){console.error('Add celeb error:',e);toast('Error: '+(e.message||'Check Firestore rules in Firebase Console'),'error');}
  btn.disabled=false;btn.textContent='Add Celebrity →';
};

window.deleteCeleb=async function(id,name){
  if(!confirm('Delete '+name+'? This cannot be undone.'))return;
  await deleteDoc(doc(db,'celebrities',id));
  toast(name+' removed 🗑');
  await fetchAllCelebs();
  renderManageCelebs(_allCelebsCache);
  load_overview();
};

// ── POSTS ── (with Edit + Delete for Chief Admin)
window.load_posts=async function(){
  const el=document.getElementById('postsList');
  const snap=await sg(query(collection(db,'posts'),limit(30)));
  const posts=[];snap.forEach(d=>posts.push({id:d.id,...d.data()}));
  posts.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  if(!posts.length){el.innerHTML='<div style="color:var(--muted);font-size:0.72rem;padding:10px;">No posts yet.</div>';return;}
  el.innerHTML=posts.map(p=>{
    const dt=p.createdAt?.toDate?p.createdAt.toDate().toLocaleDateString():'';
    const preview=esc((p.title||p.content||'').substring(0,60));
    const hasImg=p.imageUrl&&p.imageUrl.startsWith('http');
    return`<div class="m-row" style="align-items:flex-start;flex-wrap:wrap;gap:8px;">
      ${hasImg?`<img src="${esc(p.imageUrl)}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.remove()"/>`:
        `<div style="width:44px;height:44px;background:var(--card);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">${p.isAdmin?'🌟':'👤'}</div>`}
      <div style="flex:1;min-width:0;">
        <div class="m-name">${preview||'(no content)'}</div>
        <div class="m-meta">${esc(p.userName||'ICONIK')} · ${esc(p.category||'General')} · ${dt}</div>
      </div>
      <div style="display:flex;gap:5px;flex-shrink:0;">
        <button class="m-btn m-btn-warn" onclick="editPost('${p.id}')">✏️</button>
        <button class="m-btn m-btn-err" onclick="deleteItem('posts','${p.id}',load_posts)">🗑</button>
      </div>
    </div>`;
  }).join('');
};

// ── EDIT POST ──
window.editPost=async function(postId){
  try{
    const d=await getDoc(doc(db,'posts',postId));
    if(!d.exists()){toast('Post not found','error');return;}
    const p={id:d.id,...d.data()};
    // Fill publish form
    document.getElementById('pTitle').value=p.title||'';
    document.getElementById('pContent').value=p.content||'';
    document.getElementById('pCat').value=p.category||'';
    document.getElementById('pMediaUrl').value=p.imageUrl||'';
    // Switch button to update mode
    const btn=document.getElementById('publishBtn');
    btn.textContent='Update Post →';
    btn.onclick=async function(){
      btn.disabled=true;btn.textContent='Updating...';
      try{
        await setDoc(doc(db,'posts',postId),{
          title:document.getElementById('pTitle').value.trim(),
          content:document.getElementById('pContent').value.trim(),
          category:document.getElementById('pCat').value,
          imageUrl:document.getElementById('pMediaUrl').value.trim(),
          updatedAt:serverTimestamp()
        },{merge:true});
        toast('Post updated! ✅');
        btn.textContent='Publish as ICONIK →';
        btn.onclick=function(){publishPost();};
        load_posts();
      }catch(e){toast('Error updating','error');}
      btn.disabled=false;
    };
    document.getElementById('pTitle').scrollIntoView({behavior:'smooth'});
    toast('Editing post — make changes and tap Update ✏️','info');
  }catch(e){toast('Error loading post','error');}
};

window.publishPost=async function(){
  const btn=document.getElementById('publishBtn');
  const content=document.getElementById('pContent').value.trim();
  if(!content){toast('Post content required','error');return;}
  btn.disabled=true;btn.textContent='Publishing...';
  try{
    let mediaUrl=document.getElementById('pMediaUrl').value.trim();
    const file=document.getElementById('pMediaFile').files[0];
    if(file&&!mediaUrl){mediaUrl=await uploadFile(file);}
    await addDoc(collection(db,'posts'),{
      title:document.getElementById('pTitle').value.trim(),
      content,category:document.getElementById('pCat').value,
      imageUrl:mediaUrl,userId:'admin',userName:'ICONIK',
      userPhoto:'',isAdmin:true,likeCount:0,commentCount:0,
      createdAt:serverTimestamp()
    });
    toast('Post published! 🌟');
    ['pTitle','pContent','pMediaUrl'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('pPreview').style.display='none';
    load_posts();
  }catch(e){toast(e.message||'Error publishing','error');}
  btn.disabled=false;btn.textContent='Publish as ICONIK →';
};

// ── NEWS ──
window.load_news=async function(){
  const el=document.getElementById('newsList');
  const snap=await sg(query(collection(db,'celebrityNews'),limit(20)));
  const news=[];snap.forEach(d=>news.push({id:d.id,...d.data()}));
  news.sort((a,b)=>(b.publishedAt?.seconds||0)-(a.publishedAt?.seconds||0));
  if(!news.length){el.innerHTML='<div style="color:var(--muted);font-size:0.72rem;padding:10px;">No news yet.</div>';return;}
  el.innerHTML=news.map(n=>`
    <div class="m-row">
      <div style="flex:1;min-width:0;">
        <div class="m-name">${esc(n.title||'')}</div>
        <div class="m-meta">${esc(n.category||'')} · ${n.publishedAt?.toDate?n.publishedAt.toDate().toLocaleDateString():''}</div>
      </div>
      <button class="m-btn m-btn-err" onclick="deleteItem('celebrityNews','${n.id}',load_news)">🗑</button>
    </div>`).join('');
};

window.addNews=async function(){
  const btn=document.getElementById('addNewsBtn');
  const title=document.getElementById('nTitle').value.trim();
  const summary=document.getElementById('nSummary').value.trim();
  if(!title||!summary){toast('Title and summary required','error');return;}
  btn.disabled=true;btn.textContent='Publishing...';
  try{
    let imgUrl=document.getElementById('nImgUrl').value.trim();
    const file=document.getElementById('nImgFile').files[0];
    if(file&&!imgUrl){imgUrl=await uploadFile(file);}
    await addDoc(collection(db,'celebrityNews'),{
      title,category:document.getElementById('nCat').value,
      summary,content:document.getElementById('nContent').value.trim(),
      imageUrl:imgUrl,publishedAt:serverTimestamp()
    });
    toast('News published! 📰');
    ['nTitle','nSummary','nContent','nImgUrl'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('nPreview').style.display='none';
    load_news();
  }catch(e){toast(e.message||'Error publishing','error');}
  btn.disabled=false;btn.textContent='Publish News →';
};

// ── EVENTS ──
window.load_events=async function(){
  const el=document.getElementById('eventsList');
  const snap=await sg(query(collection(db,'events'),limit(20)));
  const events=[];snap.forEach(d=>events.push({id:d.id,...d.data()}));
  events.sort((a,b)=>(a.eventDate||'').localeCompare(b.eventDate||''));
  if(!events.length){el.innerHTML='<div style="color:var(--muted);font-size:0.72rem;padding:10px;">No events yet.</div>';return;}
  el.innerHTML=events.map(e=>`
    <div class="m-row">
      <div style="flex:1;min-width:0;">
        <div class="m-name">${esc(e.name||'')}</div>
        <div class="m-meta">${esc(e.venue||'')} · ${esc(e.eventDate||'')} · ${esc(e.price||'')}</div>
      </div>
      <button class="m-btn m-btn-err" onclick="deleteItem('events','${e.id}',load_events)">🗑</button>
    </div>`).join('');
};

window.addEvent=async function(){
  const btn=document.getElementById('addEventBtn');
  const name=document.getElementById('eName').value.trim();
  const venue=document.getElementById('eVenue').value.trim();
  const date=document.getElementById('eDate').value;
  if(!name||!venue||!date){toast('Name, venue and date required','error');return;}
  btn.disabled=true;btn.textContent='Adding...';
  try{
    await addDoc(collection(db,'events'),{
      name,venue,eventDate:date,
      category:document.getElementById('eCat').value,
      price:document.getElementById('ePrice').value.trim(),
      ticketLink:document.getElementById('eLink').value.trim(),
      description:document.getElementById('eDesc').value.trim(),
      createdAt:serverTimestamp()
    });
    toast('Event added! 🎫');
    ['eName','eVenue','ePrice','eLink','eDesc'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('eDate').value='';
    load_events();
  }catch(e){toast(e.message||'Error adding event','error');}
  btn.disabled=false;btn.textContent='Add Event →';
};

// ── MESSAGES ──
window.load_messages=async function(){
  const el=document.getElementById('messagesList');
  const snap=await sg(query(collection(db,'messages'),limit(20)));
  const msgs=[];snap.forEach(d=>msgs.push({id:d.id,...d.data()}));
  msgs.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  if(!msgs.length){el.innerHTML='<div style="color:var(--muted);font-size:0.72rem;padding:10px;">No messages sent yet.</div>';return;}
  el.innerHTML=msgs.map(m=>`
    <div class="m-row">
      <div style="flex:1;min-width:0;">
        <div class="m-name">${esc(m.subject||'Message')}</div>
        <div class="m-meta">${esc((m.content||'').substring(0,60))} · ${m.createdAt?.toDate?m.createdAt.toDate().toLocaleDateString():''}</div>
      </div>
      <button class="m-btn m-btn-err" onclick="deleteItem('messages','${m.id}',load_messages)">🗑</button>
    </div>`).join('');
};

window.sendMessage=async function(){
  const btn=document.getElementById('sendMsgBtn');
  const content=document.getElementById('msgBody').value.trim();
  if(!content){toast('Message content required','error');return;}
  btn.disabled=true;btn.textContent='Sending...';
  try{
    await addDoc(collection(db,'messages'),{
      subject:document.getElementById('msgSubj').value.trim(),
      content,fromName:'ICONIK',fromRole:'ICONIK',fromIsAdmin:true,
      createdAt:serverTimestamp()
    });
    toast('Message sent to all members! 📩');
    ['msgSubj','msgBody'].forEach(id=>document.getElementById(id).value='');
    load_messages();
  }catch(e){toast(e.message||'Error sending','error');}
  btn.disabled=false;btn.textContent='Send to All Members →';
};

// ── POLLS ──
window.load_polls=async function(){
  const el=document.getElementById('pollsList');
  const snap=await sg(query(collection(db,'polls'),limit(10)));
  const polls=[];snap.forEach(d=>polls.push({id:d.id,...d.data()}));
  if(!polls.length){el.innerHTML='<div style="color:var(--muted);font-size:0.72rem;padding:10px;">No polls yet.</div>';return;}
  el.innerHTML=polls.map(p=>`
    <div class="m-row">
      <div style="flex:1;min-width:0;">
        <div class="m-name">${esc(p.question||'')}</div>
        <div class="m-meta">${(p.options||[]).map(o=>esc(o)).join(' · ')}</div>
      </div>
      <button class="m-btn m-btn-err" onclick="deleteItem('polls','${p.id}',load_polls)">🗑</button>
    </div>`).join('');
};

window.addPoll=async function(){
  const btn=document.getElementById('addPollBtn');
  const q=document.getElementById('pollQ').value.trim();
  const o1=document.getElementById('pollO1').value.trim();
  const o2=document.getElementById('pollO2').value.trim();
  if(!q||!o1||!o2){toast('Question and at least 2 options required','error');return;}
  btn.disabled=true;btn.textContent='Creating...';
  const options=[o1,o2];
  const o3=document.getElementById('pollO3').value.trim();
  const o4=document.getElementById('pollO4').value.trim();
  if(o3)options.push(o3);if(o4)options.push(o4);
  const days=parseInt(document.getElementById('pollDur').value)||7;
  const endsAt=new Date(Date.now()+days*86400000);
  try{
    await addDoc(collection(db,'polls'),{question:q,options,votes:{},totalVotes:0,endsAt,createdAt:serverTimestamp()});
    toast('Poll created! 🗳️');
    ['pollQ','pollO1','pollO2','pollO3','pollO4'].forEach(id=>document.getElementById(id).value='');
    load_polls();
  }catch(e){toast(e.message||'Error creating poll','error');}
  btn.disabled=false;btn.textContent='Create Poll →';
};

// ── MAGAZINE ──
window.addMagazineArticle=async function(){
  const btn=document.getElementById('addMagBtn');
  const title=document.getElementById('magTitle').value.trim();
  const summary=document.getElementById('magSummary').value.trim();
  if(!title||!summary){toast('Title and summary required','error');return;}
  btn.disabled=true;btn.textContent='Publishing...';
  try{
    let imgUrl=document.getElementById('magImgUrl').value.trim();
    await addDoc(collection(db,'magazine'),{
      title,category:document.getElementById('magCat').value,
      summary,content:document.getElementById('magContent').value.trim(),
      imageUrl:imgUrl,publishedAt:serverTimestamp()
    });
    toast('Article published! 📖');
    ['magTitle','magSummary','magContent','magImgUrl'].forEach(id=>document.getElementById(id).value='');
  }catch(e){toast(e.message||'Error publishing','error');}
  btn.disabled=false;btn.textContent='Publish Article →';
};

// ── TV ──
window.addTV=async function(){
  const btn=document.getElementById('addTvBtn');
  const title=document.getElementById('tvTitle').value.trim();
  const url=document.getElementById('tvUrl').value.trim();
  if(!title||!url){toast('Title and URL required','error');return;}
  btn.disabled=true;btn.textContent='Adding...';
  try{
    await addDoc(collection(db,'iconikTV'),{
      title,category:document.getElementById('tvCat').value,
      videoUrl:url,thumbUrl:document.getElementById('tvThumb').value.trim(),
      duration:document.getElementById('tvDuration').value.trim(),
      publishedAt:serverTimestamp()
    });
    toast('Video added! 📺');
    ['tvTitle','tvUrl','tvThumb','tvDuration'].forEach(id=>document.getElementById(id).value='');
  }catch(e){toast(e.message||'Error adding','error');}
  btn.disabled=false;btn.textContent='Add to ICONIK TV →';
};

// ── SUB ADMINS — FULL CHIEF ADMIN CONTROL ──
window.load_subadmins=async function(){
  const el=document.getElementById('subAdminList');
  try{
    const snap=await sg(query(collection(db,'users'),where('role','in',['Sub Admin','Moderator','Content Manager']),limit(20)));
    const admins=[];snap.forEach(d=>admins.push({id:d.id,...d.data()}));
    if(!admins.length){el.innerHTML='<div style="color:var(--muted);font-size:0.72rem;padding:10px;">No sub admins yet. Use the form above to assign one.</div>';return;}
    el.innerHTML=admins.map(a=>{
      const nm=esc(a.name||a.email||'Admin');
      const photoUrl=a.profilePic&&a.profilePic.startsWith('http')?a.profilePic:'';
      const avHTML=photoUrl?`<img src="${esc(photoUrl)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.remove()"/>`:'';
      return`<div class="m-row" style="flex-wrap:wrap;gap:8px;">
        <div class="m-av" style="position:relative;overflow:hidden;">${avHTML}<span style="position:relative;z-index:0;">${nm.charAt(0)}</span></div>
        <div style="flex:1;min-width:0;">
          <div class="m-name">${nm} <span class="badge badge-ok">${esc(a.role||'Sub Admin')}</span></div>
          <div class="m-meta">${esc(a.email||'')} · 📂 ${esc(a.category||'All categories')}</div>
        </div>
        <div style="display:flex;gap:5px;flex-shrink:0;flex-wrap:wrap;">
          <button class="m-btn m-btn-info" onclick="viewSubAdminDash('${a.id}','${nm}')">👁 View</button>
          <button class="m-btn m-btn-warn" onclick="reassignSubAdmin('${a.id}','${nm}')">🔄 Edit</button>
          <button class="m-btn m-btn-err" onclick="fireSubAdmin('${a.id}','${nm}')">🔥 Remove</button>
        </div>
      </div>`;
    }).join('');
  }catch(e){el.innerHTML='<div style="color:var(--muted);padding:10px;">Error loading sub admins.</div>';}
};

window.addSubAdmin=async function(){
  const email=document.getElementById('saEmail').value.trim();
  const role=document.getElementById('saRole').value;
  const catEl=document.getElementById('saCat');
  const category=catEl?catEl.value:'All';
  if(!email){toast('Email required','error');return;}
  try{
    const snap=await sg(query(collection(db,'users'),where('email','==',email),limit(1)));
    if(snap.empty){toast('No member found with that email. They must register first.','error');return;}
    const uid=snap.docs[0].id;
    await updateDoc(doc(db,'users',uid),{role,category:category||'All'});
    toast(email+' assigned as '+role+'! 🛡️');
    document.getElementById('saEmail').value='';
    load_subadmins();
  }catch(e){toast(e.message||'Error assigning sub admin','error');}
};

window.reassignSubAdmin=async function(uid,name){
  const newRole=prompt('New role for '+name+':\n(Sub Admin / Moderator / Content Manager)','Sub Admin');
  if(!newRole)return;
  const newCat=prompt('Assign community category\n(e.g. Music, Sports, Fashion, All):','All');
  if(newCat===null)return;
  try{
    await updateDoc(doc(db,'users',uid),{role:newRole,category:newCat||'All'});
    toast(name+' updated as '+newRole+' — '+newCat+' ✅');
    load_subadmins();
  }catch(e){toast('Error updating sub admin','error');}
};

window.fireSubAdmin=async function(uid,name){
  if(!confirm('Remove '+name+' from Sub Admin role?\nThey will revert to regular member.'))return;
  try{
    await updateDoc(doc(db,'users',uid),{role:'member',category:''});
    toast(name+' removed from Sub Admin role 🔥');
    load_subadmins();
  }catch(e){toast('Error removing sub admin','error');}
};

window.viewSubAdminDash=function(uid,name){
  toast('Opening '+name+"'s Sub Admin panel 👁","info");
  window.open('/subadmin.html','_blank');
};

// ── UTILS ──
window.deleteItem=async function(col,id,reloadFn){
  if(!confirm('Delete this item? Cannot be undone.'))return;
  await deleteDoc(doc(db,col,id));
  toast('Deleted ✅');
  if(typeof reloadFn==='function')reloadFn();
};
