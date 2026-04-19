// ── ICONIK DASHBOARD — Self-Contained Module ──
import{initializeApp}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import{getAuth,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import{getFirestore,collection,doc,setDoc,getDoc,getDocs,addDoc,deleteDoc,query,where,limit,serverTimestamp}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const _cfg={apiKey:"AIzaSyCnX9DszicduSwsFwBZ_iTLI47NPeXkteE",authDomain:"iconik-global.firebaseapp.com",projectId:"iconik-global",storageBucket:"iconik-global.firebasestorage.app",messagingSenderId:"1040054516979",appId:"1:1040054516979:web:33cd5f07ae8fc146a30b86"};
const _app=initializeApp(_cfg),auth=getAuth(_app),db=getFirestore(_app);

async function safeGet(ref){
 try{return await Promise.race([getDocs(ref),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),5000))]);}
 catch(e){console.warn('Firestore:',e.message);return{empty:true,size:0,forEach:()=>{},docs:[]};}
}
function toast(msg,type='success'){
 let t=document.getElementById('toast');
 if(!t){t=document.createElement('div');t.id='toast';t.style.cssText='position:fixed;bottom:80px;right:12px;background:#141420;border:1px solid rgba(255,255,255,0.09);padding:10px 14px;border-radius:20px;font-family:Montserrat,sans-serif;font-size:0.7rem;color:#F5F0E8;opacity:0;transform:translateY(16px);transition:all 0.28s;pointer-events:none;max-width:260px;z-index:99999;';document.body.appendChild(t);}
 t.textContent=msg;
 t.style.background=type==='error'?'#7f1d1d':type==='info'?'#1e3a5f':'#14532d';
 t.style.opacity='1';t.style.transform='translateY(0)';
 setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(16px)';},3000);
}
async function uploadMedia(file){
 const fd=new FormData();fd.append('file',file);fd.append('upload_preset','iconik_uploads');
 const r=await fetch('https://api.cloudinary.com/v1_1/dhazrf2xr/upload',{method:'POST',body:fd});
 if(!r.ok)throw new Error('Upload failed — ensure iconik_uploads preset is Unsigned');
 const d=await r.json();return{url:d.secure_url,type:file.type.startsWith('video')?'video':'image'};
}

// ── STATE ──
let cU=null; // current user (Firebase auth)
let cD=null; // current user data (Firestore)
let allCelebs=[]; // celebrity cache
let allMembers=[]; // member cache
let currentView='feed';
let currentRoom='general';
let chatInterval=null;

// ── INIT ──
onAuthStateChanged(auth,async u=>{
  if(!u){location.href='app.html';return;}
  cU=u;
  cD=await loadUserData(u.uid);
  if(!cD){location.href='app.html';return;}
  initUI();
  initSidebar();
  initBottomNav();
  loadFeed();
  loadCelebs();
  loadNews();
  loadCommunities();
  loadEvents();
  loadRadio();
  loadTV();
  loadMagazine();
  loadWellness('fitness');
  loadRankings();
  loadPolls();
  loadMyProfile();
  loadMessages();
  loadNotifications();
  loadVIP();
  loadMembers();
});

// ── LOAD USER DATA ──
async function loadUserData(uid){
  try{
    const d=await getDoc(doc(db,'users',uid));
    return d.exists()?{id:d.id,...d.data()}:null;
  }catch(e){console.error('loadUserData:',e);return null;}
}

// ── INIT UI ──
function initUI(){
  // Nav
  const nm=cD.name||'Member';
  document.getElementById('navName').textContent=nm;
  // Avatar
  const av=document.getElementById('navAv');
  av.textContent=nm.charAt(0).toUpperCase();
  if(cD.profilePic&&cD.profilePic.startsWith('http')){
    document.getElementById('navAvImg').src=cD.profilePic;
    document.getElementById('navAvImg').style.display='block';
  }
  // Sidebar name/tier
  document.getElementById('sbName').textContent=nm;
  document.getElementById('sbTier').textContent=cD.tier||'Fan';
  // Feed avatar
  const fa=document.getElementById('feedAv');
  if(fa)fa.textContent=nm.charAt(0).toUpperCase();
  // Notif bell
  document.getElementById('notifBell').onclick=()=>showView('notifs');
  // Nav avatar click → profile
  document.getElementById('navAv').onclick=()=>showView('myprofile');
}

// ── SIDEBAR ──
function initSidebar(){
  const sb=document.getElementById('sb');
  const ov=document.getElementById('sbOv');
  // Open
  document.getElementById('menuBtn').onclick=()=>{sb.classList.add('on');ov.classList.add('on');};
  // Close
  document.getElementById('sbClose').onclick=closeSidebar;
  ov.onclick=closeSidebar;
  // Nav links
  sb.querySelectorAll('.sb-lnk[data-view]').forEach(lnk=>{
    lnk.onclick=function(){
      const v=this.dataset.view;
      closeSidebar();
      showView(v);
    };
  });
  // Logout
  document.getElementById('logoutBtn').onclick=async()=>{
    await signOut(auth);
    location.href='app.html';
  };
}
function closeSidebar(){
  document.getElementById('sb').classList.remove('on');
  document.getElementById('sbOv').classList.remove('on');
}

// ── BOTTOM NAV ──
function initBottomNav(){
  document.querySelectorAll('.bnav .bn').forEach(btn=>{
    btn.onclick=function(){showView(this.dataset.view);};
  });
}

// ── SHOW VIEW ──
function showView(nm){
  // Hide all views
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));
  // Show target
  const target=document.getElementById(nm+'V');
  if(target)target.classList.add('on');
  currentView=nm;
  // Update bottom nav active state
  document.querySelectorAll('.bnav .bn').forEach(b=>{
    b.classList[b.dataset.view===nm?'add':'remove']('active');
  });
  // Stop chat polling when leaving chat
  if(nm!=='chat'&&chatInterval){clearInterval(chatInterval);chatInterval=null;}
  // Start chat polling when entering chat
  if(nm==='chat'){loadChat();chatInterval=setInterval(loadChat,8000);}
}
window.showView=showView;

window.goBack=function(view){showView(view||'feed');};

// ── FEED ──
async function loadFeed(){
  const el=document.getElementById('feedList');
  try{
    const snap=await safeGet(query(collection(db,'posts'),limit(30)));
    const posts=[];
    snap.forEach(d=>posts.push({id:d.id,...d.data()}));
    posts.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    if(!posts.length){
      el.innerHTML=`<div class="pcard"><p style="text-align:center;color:var(--cd);padding:14px;">No posts yet. Be the first to share! 🌟</p></div>`;
      return;
    }
    el.innerHTML=posts.map(p=>postCard(p)).join('');
  }catch(e){
    el.innerHTML=`<div class="pcard"><p style="text-align:center;color:var(--cd);padding:14px;">Feed loading... 🔄</p></div>`;
    console.error(e);
  }
}

function postCard(p){
  const nm=esc(p.userName||'ICONIK');
  const av=p.userPhoto?`<img src="${esc(p.userPhoto)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none'"/>`:nm.charAt(0);
  const dt=p.createdAt?.toDate?p.createdAt.toDate().toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'}):'';
  return`<div class="pcard">
    <div class="ph">
      <div class="pav">${av}</div>
      <div>
        <div class="pau">${nm} ${p.isAdmin?'<span style="font-family:\'Bebas Neue\',sans-serif;font-size:0.5rem;background:var(--gold);color:var(--obs);padding:1px 5px;margin-left:4px;">ICONIK</span>':''}</div>
        <div class="pt">${esc(p.category||'')} ${dt?'· '+dt:''}</div>
      </div>
    </div>
    ${p.title?`<div class="ptitle">${esc(p.title)}</div>`:''}
    <div class="pbody">${esc(p.content||'')}</div>
    ${p.imageUrl&&p.imageUrl.startsWith('http')?`<img src="${esc(p.imageUrl)}" style="width:100%;margin-top:9px;border-radius:6px;max-height:240px;object-fit:cover;" loading="lazy" onerror="this.style.display='none'"/>` :''}
    <div style="display:flex;gap:14px;margin-top:10px;">
      <span style="font-size:0.66rem;color:var(--cd);cursor:pointer;" onclick="likePost('${p.id}',this)">♡ ${p.likeCount||0}</span>
      <span style="font-size:0.66rem;color:var(--cd);">💬 ${p.commentCount||0}</span>
      <span style="font-size:0.66rem;color:var(--cd);cursor:pointer;" onclick="shareItem('${p.id}')">🔗 Share</span>
    </div>
  </div>`;
}

window.likePost=async function(postId,el){
  try{
    await setDoc(doc(db,'likes',`${cU.uid}_${postId}`),{userId:cU.uid,postId,createdAt:serverTimestamp()});
    if(el){const n=parseInt(el.textContent.replace(/[^\d]/g,''))||0;el.textContent=`♥ ${n+1}`;el.style.color='var(--err)';}
  }catch{}
};

window.openComposer=function(type='text'){
  const content=prompt(type==='photo'?'Photo URL or describe your post:':'What\'s on your mind?');
  if(!content)return;
  createPost(content,type);
};

async function createPost(content,type){
  try{
    await addDoc(collection(db,'posts'),{
      content,title:'',category:cD.categories?.[0]||'',
      userId:cU.uid,userName:cD.name,userPhoto:cD.profilePic||'',
      imageUrl:'',videoUrl:'',likeCount:0,commentCount:0,
      isAdmin:false,createdAt:serverTimestamp()
    });
    toast('Post shared! 🌟');
    loadFeed();
  }catch(e){toast('Error posting. Try again.','error');}
}

// ── CELEBRITIES ──
async function loadCelebs(){
  const el=document.getElementById('celebGrid');
  try{
    const snap=await safeGet(collection(db,'celebrities'));
    allCelebs=[];
    if(!snap.empty)snap.forEach(d=>allCelebs.push({id:d.id,...d.data()}));
    renderCelebs(allCelebs);
  }catch(e){renderCelebs([]);console.error(e);}
}

function renderCelebs(celebs){
  const el=document.getElementById('celebGrid');
  if(!celebs.length){
    el.innerHTML=`<div style="grid-column:span 2;text-align:center;padding:24px;color:var(--cd);">No icons added yet. Admin adds celebrities from the Admin Panel. ⭐</div>`;
    return;
  }
  el.innerHTML=celebs.map(c=>{
    const colors=['#7C3AED','#DC2626','#059669','#D97706','#EC4899','#2563EB'];
    const clr=colors[Math.abs((c.name||'A').charCodeAt(0))%colors.length];
    const nm=esc(c.name||'Celebrity');
    const ph=c.photo&&c.photo.startsWith('http')?`<img src="${esc(c.photo)}" alt="" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" onerror="this.remove()"/>`:'';
    return`<div class="ccard" data-id="${c.id}">
      <div class="cimg" style="background:${clr}22;position:relative;">
        ${ph}
        <span style="position:relative;z-index:1;">${c.name?.charAt(0)||'⭐'}</span>
      </div>
      <div class="ci">
        <div class="cn">${nm}</div>
        <div class="ccat">${esc(c.category||'')}</div>
        <div class="cmeta">${esc(c.country||'')}${c.followers?' · '+c.followers:''}</div>
      </div>
    </div>`;
  }).join('');
  // Attach clicks via event delegation — NO inline onclick
  document.getElementById('celebGrid').querySelectorAll('.ccard').forEach(card=>{
    card.onclick=function(){openCeleb(this.dataset.id);};
  });
}

window.filterCelebs=function(){
  const q=document.getElementById('celebSearch').value.toLowerCase();
  if(!q){renderCelebs(allCelebs);return;}
  renderCelebs(allCelebs.filter(c=>
    c.name?.toLowerCase().includes(q)||c.category?.toLowerCase().includes(q)
  ));
};

function openCeleb(celebId){
  const c=allCelebs.find(x=>x.id===celebId);
  if(!c)return;
  showView('celebSingle');
  // Use requestAnimationFrame to ensure DOM is painted before writing
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      const el=document.getElementById('celebSingleContent');
      if(!el)return;
      renderCelebPage(celebId,c,el);
    });
  });
}

function renderCelebPage(celebId,c,el){
  const colors=['#7C3AED','#DC2626','#059669','#D97706','#EC4899','#2563EB'];
  const clr=colors[Math.abs((c.name||'A').charCodeAt(0))%colors.length];
  const nm=esc(c.name||'Celebrity');
  const cat=esc(c.category||'');
  const country=esc(c.country||'—');
  const bio=esc(c.bio||'');
  const followers=esc(c.followers||'—');
  const ph=c.photo&&c.photo.startsWith('http')?`<img src="${esc(c.photo)}" alt="${nm}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" onerror="this.remove()"/>`:'';

  el.innerHTML=`
    <div style="width:100%;height:200px;background:linear-gradient(135deg,${clr}66,${clr}22);position:relative;display:flex;align-items:center;justify-content:center;border-radius:var(--rad);margin-bottom:14px;overflow:hidden;">
      ${ph}
      <span style="position:relative;z-index:1;font-size:5rem;opacity:0.4;">${(c.name||'?').charAt(0)}</span>
      <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(7,7,13,0.92),transparent 50%);z-index:2;"></div>
      <div style="position:absolute;bottom:14px;left:14px;right:14px;z-index:3;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:0.6rem;letter-spacing:0.16em;color:var(--gold);margin-bottom:3px;">${cat}</div>
        <div style="font-family:'Playfair Display',serif;font-weight:700;font-size:1.2rem;color:#fff;">${nm}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
      <div class="sbox"><div class="snum" style="font-size:0.8rem;">${followers}</div><div class="slbl">Followers</div></div>
      <div class="sbox"><div class="snum" style="font-size:0.8rem;">${country}</div><div class="slbl">Origin</div></div>
      <div class="sbox"><div class="snum" style="font-size:0.8rem;">${esc(c.status||'Active')}</div><div class="slbl">Status</div></div>
    </div>
    ${bio?`<div class="pcard" style="margin-bottom:14px;"><div class="pbody">${bio}</div></div>`:''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
      <button id="cFollowBtn" class="btn-gold">⭐ Follow</button>
      <button id="cShareBtn" class="btn-ghost">🔗 Share</button>
    </div>
    <div class="sh">Latest Posts</div>
    <div id="celebPosts"><div class="ldr"><div class="lring"></div></div></div>`;

  // Safe event listeners — no inline onclick
  document.getElementById('cFollowBtn').onclick=()=>followCeleb(celebId,c.name||'');
  document.getElementById('cShareBtn').onclick=()=>{
    if(navigator.share)navigator.share({title:`${c.name} on ICONIK`,url:location.href});
    else{navigator.clipboard?.writeText(location.href);toast('Link copied! 🔗');}
  };

  // Load posts for this category
  safeGet(query(collection(db,'posts'),limit(30))).then(snap=>{
    const posts=[];
    snap.forEach(d=>{const p=d.data();if(p.category===c.category)posts.push({id:d.id,...p});});
    posts.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    const pEl=document.getElementById('celebPosts');
    if(!pEl)return;
    pEl.innerHTML=posts.length?posts.slice(0,6).map(p=>postCard(p)).join(''):`<div class="pcard"><p style="text-align:center;color:var(--cd);padding:12px;">No posts yet for ${cat}. Admin adds content from the Admin Panel.</p></div>`;
  }).catch(()=>{});
}

async function followCeleb(id,name){
  try{
    await setDoc(doc(db,'follows',`${cU.uid}_celeb_${id}`),{userId:cU.uid,celebId:id,celebName:name,createdAt:serverTimestamp()});
    toast(`Now following ${name}! ⭐`);
    const btn=document.getElementById('cFollowBtn');
    if(btn){btn.textContent='✓ Following';btn.style.background='rgba(255,255,255,0.08)';btn.style.color='var(--gold)';}
  }catch(e){toast(`Following ${name}! ⭐`);}
}

// ── NEWS ──
let allNews=[];
async function loadNews(){
  const el=document.getElementById('newsFeed');
  try{
    const snap=await safeGet(query(collection(db,'celebrityNews'),limit(20)));
    allNews=[];
    if(!snap.empty){
      snap.forEach(d=>allNews.push({id:d.id,...d.data()}));
      allNews.sort((a,b)=>(b.publishedAt?.seconds||0)-(a.publishedAt?.seconds||0));
      renderNews(allNews);return;
    }
  }catch{}
  // Static fallback
  allNews=[
    {title:'Bad Bunny Announces 2026 World Tour Dates',category:'Music',summary:'The Latin superstar announces a massive new world tour spanning 5 continents and 80+ cities.',icon:'🎵',time:'Today'},
    {title:'Champions League Quarter Finals — Shock Results',category:'Sports',summary:'Unexpected upsets shake the Champions League bracket as underdogs triumph.',icon:'⚽',time:'Yesterday'},
    {title:'Box Office: New Blockbuster Shatters Opening Weekend Records',category:'Film',summary:'A record-breaking opening weekend sets the stage for one of the biggest films of the decade.',icon:'🎬',time:'2 days ago'},
    {title:'Paris Fashion Week — Top 10 Looks of the Season',category:'Fashion',summary:'Designers from around the world unveil their most stunning collections yet.',icon:'👗',time:'3 days ago'},
    {title:'Grammy Nominations Announced — Big Surprises',category:'Music',summary:'This year\'s nominations include several unexpected global artists.',icon:'🎤',time:'5 days ago'},
    {title:'Sports Star Signs Historic $500M Contract',category:'Sports',summary:'A landmark deal reshapes professional sports economics globally.',icon:'🏆',time:'6 days ago'},
    {title:'Tech Giant Launches Revolutionary Fan Platform',category:'Tech',summary:'New AI-powered fan experience promises to transform celebrity-fan relationships.',icon:'💻',time:'1 week ago'},
    {title:'Wellness Icon Goes Viral With New Training Method',category:'Wellness',summary:'Millions of followers adopt the revolutionary approach to mind-body fitness.',icon:'💪',time:'1 week ago'},
  ];
  renderNews(allNews);
}

function renderNews(news){
  const el=document.getElementById('newsFeed');
  el.innerHTML=news.map((n,i)=>`
    <div class="news-card" onclick="openNewsItem(${i})">
      <div class="news-thumb">${n.icon||'📰'}</div>
      <div style="flex:1;">
        <div class="news-cat">${esc(n.category||'NEWS')}</div>
        <div class="news-title">${esc(n.title)}</div>
        <div class="news-meta">${esc(n.time||'')}${n.source?' · '+esc(n.source):''}</div>
      </div>
      <div style="color:var(--cd2);font-size:0.9rem;flex-shrink:0;">›</div>
    </div>`).join('');
}

window.filterNews=function(btn){
  document.querySelectorAll('#newsCatFilter button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const cat=btn.dataset.cat;
  renderNews(cat==='All'?allNews:allNews.filter(n=>n.category===cat));
};

window.openNewsItem=function(idx){
  const n=allNews[idx];if(!n)return;
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(7,7,13,0.97);z-index:9999;overflow-y:auto;padding:20px;';
  ov.innerHTML=`
    <button onclick="this.closest('[style]').remove()" style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.62rem;padding:8px 14px;background:transparent;border:1px solid var(--gbr);color:var(--cd);cursor:pointer;margin-bottom:16px;border-radius:4px;">← Back</button>
    <div style="text-align:center;font-size:2.5rem;margin-bottom:12px;">${n.icon||'📰'}</div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:0.6rem;letter-spacing:0.16em;color:var(--gold);margin-bottom:8px;">${esc(n.category||'')} · ${esc(n.time||'')}</div>
    <div style="font-family:'Playfair Display',serif;font-weight:700;font-size:1.1rem;color:var(--ch);line-height:1.3;margin-bottom:14px;">${esc(n.title)}</div>
    <div style="font-family:'Montserrat',sans-serif;font-size:0.76rem;color:var(--cd);line-height:1.8;">${esc(n.summary||n.content||'Full article content coming soon.')}</div>`;
  document.body.appendChild(ov);
};

// ── COMMUNITIES ──
const COMMUNITIES=[
  {name:'Music',icon:'🎵',desc:'Artists · Albums · Concerts',img:'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80'},
  {name:'Film & TV',icon:'🎬',desc:'Movies · Series · Directors',img:'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&q=80'},
  {name:'Sports',icon:'⚽',desc:'Football · Basketball · Athletics',img:'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&q=80'},
  {name:'Literature',icon:'📚',desc:'Authors · Books · Knowledge',img:'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&q=80'},
  {name:'Fashion',icon:'👗',desc:'Style · Designers · Trends',img:'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&q=80'},
  {name:'Fitness & Wellness',icon:'💪',desc:'Health · Fitness · Mind',img:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80'},
  {name:'Food & Culinary',icon:'🍽️',desc:'Chefs · Recipes · Culture',img:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80'},
  {name:'Nature',icon:'🌿',desc:'Adventure · Wildlife · Earth',img:'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&q=80'},
  {name:'Automotive',icon:'🚗',desc:'Cars · Bikes · Lifestyle',img:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&q=80'},
  {name:'Tech & Innovation',icon:'💻',desc:'AI · Gadgets · Future',img:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80'},
  {name:'Beauty',icon:'💄',desc:'Makeup · Skincare · Art',img:'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&q=80'},
  {name:'Entertainment',icon:'🎭',desc:'Comedy · Talent · Shows',img:'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&q=80'},
  {name:'Leadership',icon:'🎓',desc:'Vision · Motivation · Growth',img:'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&q=80'},
];

function loadCommunities(){
  const el=document.getElementById('comsGrid');
  const joined=cD?.categories||[];
  el.innerHTML=COMMUNITIES.map(c=>`
    <div class="com-card" onclick="toast('${esc(c.name)} community — see latest news!');showView('news');">
      <div class="com-card-img" style="background-image:url('${c.img}');background-color:#1a1a2a;">
        ${joined.some(j=>j.toLowerCase()===c.name.toLowerCase())?'<div style="position:absolute;top:6px;right:6px;font-family:\'Bebas Neue\',sans-serif;font-size:0.46rem;background:var(--gold);color:var(--obs);padding:2px 5px;">✓ JOINED</div>':''}
      </div>
      <div class="com-card-body">
        <div class="com-card-name">${c.icon} ${esc(c.name)}</div>
        <div class="com-card-desc">${esc(c.desc)}</div>
      </div>
    </div>`).join('');
}

// ── CHAT ──
async function loadChat(){
  const el=document.getElementById('chatRoom');
  const snap=await safeGet(query(collection(db,'chat_'+currentRoom),limit(50)));
  const msgs=[];
  snap.forEach(d=>msgs.push({id:d.id,...d.data()}));
  msgs.sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
  if(!msgs.length){el.innerHTML=`<div style="text-align:center;padding:20px;color:var(--cd2);font-size:0.72rem;">No messages yet. Say hello! 👋</div>`;return;}
  el.innerHTML=msgs.map(m=>{
    const mine=m.userId===cU?.uid;
    const t=m.createdAt?.toDate?m.createdAt.toDate().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
    const av=m.userPhoto?`<img src="${esc(m.userPhoto)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none'"/>`:esc((m.name||'M').charAt(0));
    return`<div class="chat-msg${mine?' mine':''}">
      <div class="chat-av">${av}</div>
      <div>
        <div class="chat-name">${mine?'You':esc(m.name||'Fan')}</div>
        <div class="chat-bubble">${esc(m.text||'')}</div>
        <div class="chat-time">${t}</div>
      </div>
    </div>`;
  }).join('');
  el.scrollTop=el.scrollHeight;
}

window.sendMsg=async function(){
  const inp=document.getElementById('chatInput');
  const text=inp.value.trim();
  if(!text||!cU)return;
  try{
    await addDoc(collection(db,'chat_'+currentRoom),{
      text,name:cD?.name||'Fan',userId:cU.uid,
      userPhoto:cD?.profilePic||'',createdAt:serverTimestamp()
    });
    inp.value='';
    loadChat();
  }catch{toast('Error sending message','error');}
};

window.switchRoom=function(btn){
  document.querySelectorAll('#chatRooms button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentRoom=btn.dataset.room;
  loadChat();
};

// ── EVENTS ──
async function loadEvents(){
  const el=document.getElementById('eventsList');
  try{
    const snap=await safeGet(query(collection(db,'events'),limit(20)));
    const events=[];
    if(!snap.empty){
      snap.forEach(d=>events.push({id:d.id,...d.data()}));
      events.sort((a,b)=>(a.eventDate||'').localeCompare(b.eventDate||''));
      el.innerHTML=events.map(e=>eventCard(e)).join('');return;
    }
  }catch{}
  // Fallback
  const staticEvents=[
    {name:'Bad Bunny — Debí Tirar Más Fotos World Tour',venue:'Madison Square Garden, New York',eventDate:'2026-05-15',price:'$85',icon:'🎵',category:'Music',month:'MAY',day:'15'},
    {name:'Champions League Final 2026',venue:'Wembley Stadium, London',eventDate:'2026-06-01',price:'$120',icon:'⚽',category:'Sports',month:'JUN',day:'01'},
    {name:'Met Gala Fan Experience',venue:'Metropolitan Museum, New York',eventDate:'2026-05-05',price:'$45',icon:'👗',category:'Fashion',month:'MAY',day:'05'},
    {name:'ICONIK Fan Meet & Greet — Global',venue:'Virtual + Global Chapters',eventDate:'2026-08-10',price:'Free',icon:'🌍',category:'All',month:'AUG',day:'10'},
    {name:'K-Pop World Festival',venue:'Seoul Olympic Stadium',eventDate:'2026-07-20',price:'$60',icon:'🎤',category:'Music',month:'JUL',day:'20'},
    {name:'Formula 1 — Monaco Grand Prix',venue:'Circuit de Monaco',eventDate:'2026-05-28',price:'$200',icon:'🏎️',category:'Sports',month:'MAY',day:'28'},
  ];
  el.innerHTML=staticEvents.map(e=>eventCard(e)).join('');
}

function eventCard(e){
  const d=new Date(e.eventDate||'');
  const month=isNaN(d)?e.month||'TBD':d.toLocaleString('en',{month:'short'}).toUpperCase();
  const day=isNaN(d)?e.day||'':d.getDate();
  return`<div class="event-card">
    <div class="event-date"><div class="event-month">${month}</div><div class="event-day">${day}</div></div>
    <div class="event-info">
      <div class="event-name">${esc(e.name||'')}</div>
      <div class="event-venue">📍 ${esc(e.venue||'')}</div>
      <div class="event-price">${esc(e.price||'')}</div>
    </div>
    <button onclick="bookEvent('${esc(e.name||'')}',this)" style="font-family:'Bebas Neue',sans-serif;font-size:0.58rem;letter-spacing:0.1em;padding:7px 12px;background:var(--gold);color:var(--obs);border:none;cursor:pointer;border-radius:4px;flex-shrink:0;">Book</button>
  </div>`;
}

window.bookEvent=function(name,btn){toast(`Booking for ${name}! 🎫`);btn.textContent='✓ Booked';btn.style.background='var(--ok)';btn.style.color='#fff';};

// ── RADIO ──
let currentAudio=null;
async function loadRadio(){
  const el=document.getElementById('radioList');
  const stations=[
    {name:'ICONIK Gold',genre:'Top Hits · Global',icon:'🏆',url:''},
    {name:'Latin Vibes',genre:'Latin · Reggaeton · Urban',icon:'🎸',url:''},
    {name:'Afro Beats FM',genre:'Afrobeats · Dancehall · Afro-pop',icon:'🥁',url:''},
    {name:'Hip-Hop Central',genre:'Hip-Hop · R&B · Trap',icon:'🎤',url:''},
    {name:'ICONIK Chill',genre:'Lo-fi · Ambient · Relax',icon:'🌙',url:''},
    {name:'Sports Anthems',genre:'Motivational · Rock · EDM',icon:'⚽',url:''},
  ];
  try{
    const snap=await safeGet(collection(db,'radioStations'));
    if(!snap.empty){const db_stations=[];snap.forEach(d=>db_stations.push({id:d.id,...d.data()}));if(db_stations.length){el.innerHTML=db_stations.map(s=>radioCard(s)).join('');attachRadioClicks();return;}}
  }catch{}
  el.innerHTML=stations.map(s=>radioCard(s)).join('');
  attachRadioClicks();
}

function radioCard(s){
  return`<div class="radio-card" data-url="${esc(s.url||'')}" data-name="${esc(s.name)}" data-genre="${esc(s.genre||'')}" data-icon="${esc(s.icon||'🎵')}">
    <div class="radio-ic">${s.icon||'🎵'}</div>
    <div style="flex:1;"><div class="radio-name">${esc(s.name)}</div><div class="radio-genre">${esc(s.genre||'')}</div></div>
    <button class="radio-play">▶</button>
  </div>`;
}

function attachRadioClicks(){
  document.querySelectorAll('.radio-card').forEach(card=>{
    card.onclick=function(){playRadio(this.dataset.url,this.dataset.name,this.dataset.genre,this.dataset.icon,this);};
  });
}

function playRadio(url,name,genre,icon,card){
  document.querySelectorAll('.radio-card').forEach(c=>c.classList.remove('playing'));
  card.classList.add('playing');
  document.getElementById('radioPlayer').style.display='block';
  document.getElementById('playerName').textContent=name;
  document.getElementById('playerGenre').textContent=genre;
  document.getElementById('playerIcon').textContent=icon;
  toast(`▶ Now playing: ${name}`);
  if(url&&url.startsWith('http')){
    if(currentAudio)currentAudio.pause();
    currentAudio=new Audio(url);
    currentAudio.play().catch(()=>{});
  }
}
window.stopRadio=function(){
  if(currentAudio){currentAudio.pause();currentAudio=null;}
  document.getElementById('radioPlayer').style.display='none';
  document.querySelectorAll('.radio-card').forEach(c=>c.classList.remove('playing'));
};

// ── TV ──
async function loadTV(){
  const el=document.getElementById('tvList');
  try{
    const snap=await safeGet(query(collection(db,'iconikTV'),limit(10)));
    const videos=[];if(!snap.empty)snap.forEach(d=>videos.push({id:d.id,...d.data()}));
    if(videos.length){el.innerHTML=videos.map(v=>tvCard(v)).join('');return;}
  }catch{}
  const staticTV=[
    {title:'Bad Bunny — Un Verano Sin Ti (Live at MSG)',category:'Music',duration:'45 min',thumb:'',icon:'🎵'},
    {title:'Messi: The GOAT Documentary',category:'Sports',duration:'1h 20 min',thumb:'',icon:'⚽'},
    {title:'ICONIK Fan Spotlight — Episode 12',category:'Fan Made',duration:'22 min',thumb:'',icon:'🎬'},
    {title:'Fashion Week Exclusive — Behind the Scenes',category:'Fashion',duration:'35 min',thumb:'',icon:'👗'},
    {title:'Tech Talk: AI & The Future of Fan Culture',category:'Interviews',duration:'18 min',thumb:'',icon:'💻'},
  ];
  el.innerHTML=staticTV.map(v=>tvCard(v)).join('');
}

function tvCard(v){
  return`<div class="tv-card" onclick="toast('${esc(v.title)} — Coming to ICONIK TV soon 📺','info')">
    <div class="tv-thumb">
      ${v.thumbUrl?`<img src="${esc(v.thumbUrl)}" alt="" onerror="this.style.display='none'"/ style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">`:''}
      <span style="font-size:2.5rem;">${v.icon||'🎬'}</span>
      <div class="tv-play">▶</div>
    </div>
    <div class="tv-body">
      <div class="tv-title">${esc(v.title)}</div>
      <div class="tv-meta">${esc(v.category||'')} ${v.duration?'· '+esc(v.duration):''}</div>
    </div>
  </div>`;
}

// ── MAGAZINE ──
async function loadMagazine(){
  const el=document.getElementById('magazineList');
  try{
    const snap=await safeGet(query(collection(db,'magazine'),limit(15)));
    const articles=[];if(!snap.empty)snap.forEach(d=>articles.push({id:d.id,...d.data()}));
    if(articles.length){
      articles.sort((a,b)=>(b.publishedAt?.seconds||0)-(a.publishedAt?.seconds||0));
      renderMagazine(articles);return;
    }
  }catch{}
  renderMagazine([
    {title:'The Rise of Global Fan Culture',category:'Culture',summary:'How ICONIK is redefining the relationship between icons and their fans worldwide.',icon:'🌍'},
    {title:'Inside Bad Bunny\'s Creative Process',category:'Music',summary:'An exclusive look at how the global superstar crafts his signature sound.',icon:'🎵'},
    {title:'The GOAT Debate: Who Defines Soccer\'s Greatest Era?',category:'Sports',summary:'Football fans weigh in on the greatest players of the modern game.',icon:'⚽'},
    {title:'Fashion Forward: The Icons Shaping Tomorrow\'s Style',category:'Fashion',summary:'Meet the designers and celebrities setting the trends of the next decade.',icon:'👗'},
    {title:'Wellness Revolution: How Celebrity Coaches Changed Fitness',category:'Wellness',summary:'The viral trainers and coaches who are transforming how we approach health.',icon:'💪'},
  ]);
}

function renderMagazine(articles){
  const el=document.getElementById('magazineList');
  if(!articles.length){el.innerHTML='<div class="pcard"><p style="text-align:center;color:var(--cd);padding:14px;">No articles yet.</p></div>';return;}
  const featured=articles[0];
  const rest=articles.slice(1);
  el.innerHTML=`
    <div class="mag-featured" onclick="openMagArticle('${esc(featured.title)}','${esc(featured.summary||'')}')">
      <div class="mag-featured-img">
        ${featured.imageUrl?`<img src="${esc(featured.imageUrl)}" alt="" onerror="this.style.display='none'"/>`:''}
        <span>${featured.icon||'📖'}</span>
      </div>
      <div class="mag-featured-body">
        <div class="mag-featured-cat">${esc(featured.category||'ICONIK')}</div>
        <div class="mag-featured-title">${esc(featured.title)}</div>
      </div>
    </div>
    ${rest.map(a=>`
      <div class="mag-card" onclick="openMagArticle('${esc(a.title)}','${esc(a.summary||'')}')">
        <div class="mag-thumb">${a.imageUrl?`<img src="${esc(a.imageUrl)}" alt="" onerror="this.style.display='none'"/>`:a.icon||'📖'}</div>
        <div><div class="mag-title">${esc(a.title)}</div><div class="mag-cat">${esc(a.category||'')}</div></div>
      </div>`).join('')}`;
}

window.openMagArticle=function(title,summary){
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(7,7,13,0.97);z-index:9999;overflow-y:auto;padding:20px;';
  ov.innerHTML=`<button onclick="this.closest('[style]').remove()" style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.62rem;padding:8px 14px;background:transparent;border:1px solid var(--gbr);color:var(--cd);cursor:pointer;margin-bottom:16px;border-radius:4px;">← Back</button>
    <div style="font-family:'Playfair Display',serif;font-weight:700;font-size:1.1rem;color:var(--ch);line-height:1.3;margin-bottom:14px;">${title}</div>
    <div style="font-family:'Montserrat',sans-serif;font-size:0.76rem;color:var(--cd);line-height:1.8;">${summary||'Full article coming soon.'}</div>`;
  document.body.appendChild(ov);
};

// ── WELLNESS ──
const wellnessContent={
  fitness:{title:'Fitness & Training 💪',body:'Build strength, endurance and peak athletic performance. Follow certified coaches and elite athletes shaping the fitness world. Top workout plans, training guides and motivation from ICONIK\'s wellness community.'},
  nutrition:{title:'Nutrition & Diet 🥗',body:'Science-backed nutrition advice, meal plans and dietary guidance from certified nutritionists. Discover the eating habits of elite performers and wellness icons worldwide.'},
  mental:{title:'Mental Wellness 🧘',body:'Mindfulness, meditation and mental health awareness. Reduce stress, improve focus and build resilience with psychologists, therapists and mindfulness coaches in the ICONIK community.'},
  beauty:{title:'Beauty & Skincare 💄',body:'Skincare science, anti-aging treatments and beauty wellness. Follow dermatologists, estheticians and beauty icons redefining how the world approaches beauty.'},
  recovery:{title:'Sports Recovery 💆',body:'Recovery science for athletes — physiotherapy, sports massage, sleep optimization and injury prevention. Follow the recovery specialists trusted by elite athletes worldwide.'},
};
function loadWellness(tab){
  const el=document.getElementById('wellnessContent');
  const w=wellnessContent[tab]||wellnessContent.fitness;
  el.innerHTML=`<div class="pcard"><div class="ptitle">${w.title}</div><div class="pbody" style="margin-top:8px;">${w.body}</div></div>
    <div class="sh" style="margin-top:12px;">Top Coaches in ${tab.charAt(0).toUpperCase()+tab.slice(1)}</div>
    <div class="pcard"><p style="text-align:center;color:var(--cd);padding:10px;">Admin adds wellness coaches and partners from the Admin Panel. Stay tuned! 💪</p></div>`;
}
window.showWellness=function(tab,btn){
  document.querySelectorAll('#wellnessV .wellness-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  loadWellness(tab);
};

// ── FIND MEMBERS ──
async function loadMembers(){
  const el=document.getElementById('membersList');
  try{
    const snap=await safeGet(query(collection(db,'users'),limit(50)));
    allMembers=[];
    snap.forEach(d=>{if(d.id!==cU?.uid)allMembers.push({id:d.id,...d.data()});});
    renderMembers(allMembers);
  }catch{renderMembers([]);}
}

function renderMembers(members){
  const el=document.getElementById('membersList');
  if(!members.length){el.innerHTML=`<div class="pcard"><p style="text-align:center;color:var(--cd);padding:14px;">No members found.</p></div>`;return;}
  el.innerHTML=members.slice(0,30).map(m=>{
    const nm=esc(m.name||'Member');
    const av=m.profilePic?`<img src="${esc(m.profilePic)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none'"/>`:nm.charAt(0);
    const cats=(m.categories||[]).slice(0,3).map(c=>`<span class="member-cat-tag">${esc(c)}</span>`).join('');
    return`<div class="member-card" data-uid="${m.id}">
      <div class="member-av">${av}</div>
      <div style="flex:1;">
        <div class="member-name">${nm} ${m.verificationStatus==='verified'?'<span style="color:var(--ok);font-size:0.7rem;">✅</span>':''}</div>
        <div class="member-meta">${m.city?esc(m.city)+', ':''} ${esc(m.country||'—')} · <span style="color:var(--gold);">${esc(m.tier||'Fan')}</span></div>
        <div class="member-cats" style="margin-top:4px;">${cats}</div>
      </div>
      <div style="color:var(--cd2);font-size:0.9rem;">›</div>
    </div>`;
  }).join('');
  // Attach click handlers via event delegation
  document.getElementById('membersList').querySelectorAll('.member-card').forEach(card=>{
    card.onclick=function(){openMemberProfile(this.dataset.uid);};
  });
}

window.searchMembers=function(){
  const q=document.getElementById('memberSearch').value.toLowerCase();
  const cat=document.getElementById('memberFilter').value;
  let filtered=allMembers;
  if(q)filtered=filtered.filter(m=>m.name?.toLowerCase().includes(q)||m.country?.toLowerCase().includes(q));
  if(cat)filtered=filtered.filter(m=>(m.categories||[]).some(c=>c.toLowerCase().includes(cat.toLowerCase())));
  renderMembers(filtered);
};

function openMemberProfile(uid){
  const m=allMembers.find(x=>x.id===uid);
  if(!m)return;
  // Track previous view
  const prev=currentView||'search';
  showView('memberProfile');
  document.getElementById('profileBackBtn').onclick=()=>showView(prev);
  // Use double rAF to ensure DOM is ready
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      const el=document.getElementById('memberProfileContent');
      if(!el)return;
      renderMemberProfile(uid,m,el);
    });
  });
}

function renderMemberProfile(uid,m,el){
  const nm=esc(m.name||'Member');
  const av=m.profilePic?`<img src="${esc(m.profilePic)}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'"/>`:nm.charAt(0);
  const catIcons={'Music':'🎵','Film & TV':'🎬','Sports':'⚽','Literature':'📚','Wellness':'💪','Nature':'🌿','Fashion':'👗','Food & Culinary':'🍽️','Automotive':'🚗','Tech & Innovation':'💻','Beauty':'💄','Leadership':'🎓','Entertainment':'🎭'};
  el.innerHTML=`
    <div class="profile-hero">
      <div class="profile-av-lg">${av}</div>
      <div class="profile-nm">${nm} ${m.verificationStatus==='verified'?'<span style="color:var(--ok);">✅</span>':''}</div>
      <div class="profile-tier">${esc(m.tier||'Fan')}</div>
      ${m.bio?`<div class="profile-bio-text">${esc(m.bio)}</div>`:''}
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">
      <div class="sbox"><div class="snum">${m.followersCount||0}</div><div class="slbl">Followers</div></div>
      <div class="sbox"><div class="snum">${m.followingCount||0}</div><div class="slbl">Following</div></div>
      <div class="sbox"><div class="snum">${m.postCount||0}</div><div class="slbl">Posts</div></div>
      <div class="sbox"><div class="snum">${m.likeCount||0}</div><div class="slbl">Likes</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
      <button id="mpFollowBtn" class="btn-gold">+ Follow</button>
      <button id="mpMsgBtn" class="btn-ghost">✉️ Message</button>
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-family:'Montserrat',sans-serif;font-size:0.66rem;color:var(--cd);">
      📍 ${esc(m.city?m.city+', ':'')}${esc(m.country||'—')}
    </div>
    <div class="sh">Communities</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
      ${(m.categories||[]).length?(m.categories||[]).map(c=>`<div style="background:var(--gb);border:1px solid var(--gbr);padding:7px 11px;font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.64rem;color:var(--ch);border-radius:4px;">${catIcons[c]||'🌟'} ${esc(c)}</div>`).join(''):'<span style="color:var(--cd2);font-size:0.7rem;">No communities listed</span>'}
    </div>`;

  // Attach handlers safely
  document.getElementById('mpFollowBtn').onclick=()=>followMember(uid,m.name||'Member');
  document.getElementById('mpMsgBtn').onclick=()=>toast('Message feature coming soon 💬','info');
}

async function followMember(uid,name){
  try{
    await setDoc(doc(db,'follows',`${cU.uid}_${uid}`),{followerId:cU.uid,followingId:uid,createdAt:serverTimestamp()});
    toast(`Now following ${name}! ⭐`);
    const btn=document.getElementById('mpFollowBtn');
    if(btn){btn.textContent='✓ Following';btn.style.background='rgba(255,255,255,0.06)';btn.style.color='var(--gold)';}
  }catch{toast(`Following ${name}! ⭐`);}
}

// ── RANKINGS ──
async function loadRankings(){
  const el=document.getElementById('rankingsList');
  try{
    const snap=await safeGet(query(collection(db,'users'),limit(20)));
    let users=[];snap.forEach(d=>users.push({id:d.id,...d.data()}));
    users.sort((a,b)=>(b.points||0)-(a.points||0));
    if(users.length){el.innerHTML=users.map((u,i)=>rankCard(u,i+1)).join('');return;}
  }catch{}
  el.innerHTML=`<div class="pcard"><p style="text-align:center;color:var(--cd);padding:14px;">Rankings loading. Earn points by posting, following and engaging! 🏆</p></div>`;
}

function rankCard(u,pos){
  const medals=['🥇','🥈','🥉'];
  const av=u.profilePic?`<img src="${esc(u.profilePic)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none'"/>`:esc((u.name||'?').charAt(0));
  return`<div class="rank-card">
    <div class="rank-pos${pos<=3?' top':''}">${pos<=3?medals[pos-1]:pos}</div>
    <div class="rank-av">${av}</div>
    <div class="rank-name">${esc(u.name||'Member')}<div style="font-size:0.58rem;color:var(--cd2);">${esc(u.country||'—')}</div></div>
    <div class="rank-pts">${u.points||0} pts</div>
  </div>`;
}

// ── POLLS ──
async function loadPolls(){
  try{
    const snap=await safeGet(query(collection(db,'polls'),limit(10)));
    const polls=[];if(!snap.empty)snap.forEach(d=>polls.push({id:d.id,...d.data()}));
    if(polls.length){
      const now=new Date();
      const active=polls.filter(p=>{const e=p.endsAt?.toDate?p.endsAt.toDate():new Date(p.endsAt||0);return e>now;});
      const done=polls.filter(p=>{const e=p.endsAt?.toDate?p.endsAt.toDate():new Date(p.endsAt||0);return e<=now;});
      renderPolls('activePolls',active.length?active:staticPolls(),false);
      renderPolls('completedPolls',done,true);return;
    }
  }catch{}
  renderPolls('activePolls',staticPolls(),false);
  renderPolls('completedPolls',[],true);
}

function staticPolls(){
  return[
    {id:'p1',question:'Who should ICONIK partner with next?',options:['Bad Bunny','Beyoncé','Cristiano Ronaldo','BTS'],votes:{},totalVotes:247},
    {id:'p2',question:'Which new community should ICONIK add?',options:['Gaming 🎮','K-Drama 🎭','Comedy 😂','Anime 🎌'],votes:{},totalVotes:183},
    {id:'p3',question:'Best ICONIK feature so far?',options:['Live Chat','Celebrity Pages','Events','VIP Lounge'],votes:{},totalVotes:312},
  ];
}

function renderPolls(elId,polls,completed){
  const el=document.getElementById(elId);
  if(!polls.length){el.innerHTML=`<div class="pcard"><p style="text-align:center;color:var(--cd);padding:10px;">${completed?'No completed polls yet.':'No active polls. Admin creates polls from Admin Panel.'}</p></div>`;return;}
  el.innerHTML=polls.map(p=>{
    const total=p.totalVotes||Object.values(p.votes||{}).reduce((s,v)=>s+v,0)||100;
    const opts=(p.options||[]).map((opt,i)=>{
      const votes=p.votes?.[opt]||Math.floor(Math.random()*total*0.4);
      const pct=Math.round((votes/total)*100);
      return`<div class="poll-opt">
        <button class="poll-opt-btn" onclick="vote('${p.id}','${esc(opt)}',this)">
          <div class="poll-bar" style="width:${completed?pct:0}%"></div>
          <span>${esc(opt)}</span>
          ${completed?`<span class="poll-pct">${pct}%</span>`:''}
        </button>
      </div>`;
    }).join('');
    return`<div class="poll-card"><div class="poll-q">${esc(p.question)}</div>${opts}<div style="font-family:'Montserrat',sans-serif;font-size:0.6rem;color:var(--cd2);margin-top:8px;">${total} votes</div></div>`;
  }).join('');
}

window.vote=async function(pollId,option,btn){
  try{
    await setDoc(doc(db,'votes',`${cU.uid}_${pollId}`),{userId:cU.uid,pollId,option,createdAt:serverTimestamp()});
    btn.style.borderColor='var(--gold)';btn.style.color='var(--gold)';
    toast(`Voted for ${option}! 🗳️`);
  }catch{toast(`Voted for ${option}! 🗳️`);}
};

// ── MY PROFILE ──
function loadMyProfile(){
  const el=document.getElementById('myProfileContent');
  if(!cD){el.innerHTML='<div class="ldr"><div class="lring"></div></div>';return;}
  const nm=esc(cD.name||'Member');
  const av=cD.profilePic?`<img src="${esc(cD.profilePic)}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'"/>`:nm.charAt(0);
  el.innerHTML=`
    <div class="profile-hero">
      <div class="profile-av-lg" id="myAv">${av}</div>
      <div class="profile-nm">${nm}</div>
      <div class="profile-tier">${esc(cD.tier||'Fan')}</div>
      ${cD.bio?`<div class="profile-bio-text">${esc(cD.bio)}</div>`:''}
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">
      <div class="sbox"><div class="snum">${cD.followersCount||0}</div><div class="slbl">Followers</div></div>
      <div class="sbox"><div class="snum">${cD.followingCount||0}</div><div class="slbl">Following</div></div>
      <div class="sbox"><div class="snum">${cD.postCount||0}</div><div class="slbl">Posts</div></div>
      <div class="sbox"><div class="snum">${cD.points||0}</div><div class="slbl">Points</div></div>
    </div>
    <div class="sh">Edit Profile</div>
    <div class="pcard">
      <div class="fg"><label class="fl">Bio</label><textarea class="fi" id="editBio" rows="3" placeholder="Tell the ICONIK community about yourself...">${esc(cD.bio||'')}</textarea></div>
      <div class="fg"><label class="fl">Upload Profile Picture</label><input type="file" id="picFile" accept="image/*" class="fi"/></div>
      <button class="btn-gold" style="width:100%;margin-top:4px;" id="saveProfileBtn" onclick="saveProfile()">Save Profile →</button>
    </div>
    <div class="sh">My Communities</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
      ${(cD.categories||[]).map(c=>`<div style="background:var(--gb);border:1px solid var(--gbr);padding:7px 11px;font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.64rem;color:var(--ch);border-radius:4px;">${esc(c)}</div>`).join('')||'<span style="color:var(--cd2);font-size:0.7rem;">No communities. Update your profile.</span>'}
    </div>
    <div class="sh">Verification Status</div>
    <div class="pcard">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:1.5rem;">${cD.verificationStatus==='verified'?'✅':'⏳'}</span>
        <div>
          <div style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.76rem;color:var(--ch);">${cD.verificationStatus==='verified'?'Account Verified!':'Verification Pending'}</div>
          <div style="font-family:'Montserrat',sans-serif;font-size:0.64rem;color:var(--cd);">${cD.verificationStatus==='verified'?'Your identity is confirmed.':'Admin is reviewing your account. You\'ll be notified when approved.'}</div>
        </div>
      </div>
    </div>`;
}

window.saveProfile=async function(){
  const btn=document.getElementById('saveProfileBtn');
  btn.disabled=true;btn.textContent='Saving...';
  try{
    const bio=document.getElementById('editBio')?.value.trim()||'';
    const file=document.getElementById('picFile')?.files[0];
    const updates={bio};
    if(file){const r=await uploadMedia(file);updates.profilePic=r.url;}
    await setDoc(doc(db,'users',cU.uid),updates,{merge:true});
    Object.assign(cD,updates);
    loadMyProfile();initUI();
    toast('Profile saved! ✅');
  }catch(e){toast('Error saving profile. Try again.','error');console.error(e);}
  btn.disabled=false;btn.textContent='Save Profile →';
};

// ── MESSAGES ──
async function loadMessages(){
  const el=document.getElementById('msgsList');
  try{
    const snap=await safeGet(query(collection(db,'messages'),limit(20)));
    const msgs=[];snap.forEach(d=>msgs.push({id:d.id,...d.data()}));
    msgs.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    if(msgs.length){
      el.innerHTML=msgs.map(m=>`
        <div class="msg-card">
          <div class="msg-from">
            <span style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.74rem;color:var(--ch);">${esc(m.fromName||'ICONIK Admin')}</span>
            <span class="msg-badge">${esc(m.fromRole||'ADMIN')}</span>
            <span class="msg-time">${m.createdAt?.toDate?m.createdAt.toDate().toLocaleDateString():''}</span>
          </div>
          ${m.subject?`<div class="msg-subj">${esc(m.subject)}</div>`:''}
          <div class="msg-body">${esc(m.content||'')}</div>
        </div>`).join('');
      return;
    }
  }catch{}
  el.innerHTML=`<div class="msg-card"><div class="msg-body" style="text-align:center;padding:10px;">No messages yet. Admin will reach out when needed. 📩</div></div>`;
}

// ── NOTIFICATIONS ──
async function loadNotifications(){
  const el=document.getElementById('notifsList');
  const notifs=[
    {icon:cD?.verificationStatus==='verified'?'✅':'⏳',title:cD?.verificationStatus==='verified'?'Account Verified!':'Verification Pending',body:cD?.verificationStatus==='verified'?'Your identity is confirmed. Welcome to full ICONIK access.':'Admin is reviewing your account.',time:'Account',unread:cD?.verificationStatus!=='verified'},
    {icon:'🌟',title:'Welcome to ICONIK!',body:`You're part of ${(cD?.categories||[]).length} fan communities. Start exploring!`,time:'Welcome',unread:false},
  ];
  // Try to load real notifications
  try{
    const snap=await safeGet(query(collection(db,'notifications'),limit(10)));
    snap.forEach(d=>{const n=d.data();notifs.unshift({icon:'🔔',title:n.message||'New notification',body:n.fromName?`From ${n.fromName}`:'',time:n.createdAt?.toDate?n.createdAt.toDate().toLocaleDateString():'Recently',unread:true});});
  }catch{}
  el.innerHTML=notifs.map(n=>`
    <div class="notif-card${n.unread?' unread':''}">
      <div class="notif-ic">${n.icon}</div>
      <div>
        <div class="notif-title">${esc(n.title)}</div>
        <div class="notif-body">${esc(n.body)}</div>
        <div class="notif-time">${esc(n.time)}</div>
      </div>
    </div>`).join('');
  document.getElementById('notifDot').style.display='none';
}

// ── VIP ──
async function loadVIP(){
  const el=document.getElementById('vipContent');
  const isVIP=cD?.tier?.includes('VIP')||false;
  if(!isVIP){
    el.innerHTML=`
      <div class="locked-overlay">
        <div class="locked-icon">🔒</div>
        <div class="locked-title">VIP Inner Circle</div>
        <div class="locked-body">Upgrade to VIP Silver or Gold to access exclusive content, VIP chat lounge, creator fund, priority verification and more.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div class="sbox">
            <div class="snum" style="font-size:1rem;color:var(--gold);">VIP Silver</div>
            <div class="slbl">$9.99/month</div>
            <div style="font-family:'Montserrat',sans-serif;font-size:0.6rem;color:var(--cd);margin-top:8px;">Exclusive content · VIP Chat · Creator Fund</div>
            <button class="btn-gold" style="width:100%;margin-top:10px;font-size:0.58rem;" onclick="toast('Upgrade coming soon! 👑','info')">Upgrade →</button>
          </div>
          <div class="sbox">
            <div class="snum" style="font-size:1rem;color:var(--gold);">VIP Gold</div>
            <div class="slbl">$19.99/month</div>
            <div style="font-family:'Montserrat',sans-serif;font-size:0.6rem;color:var(--cd);margin-top:8px;">10% commissions · Cash prizes · $10 cashback</div>
            <button class="btn-gold" style="width:100%;margin-top:10px;font-size:0.58rem;" onclick="toast('Upgrade coming soon! 👑','info')">Upgrade →</button>
          </div>
        </div>
      </div>`;
    return;
  }
  try{
    const snap=await safeGet(query(collection(db,'vipContent'),limit(10)));
    const content=[];snap.forEach(d=>content.push({id:d.id,...d.data()}));
    el.innerHTML=`<div class="sh">Exclusive VIP Content</div>${content.length?content.map(c=>`<div class="pcard"><div class="ptitle">${esc(c.title||'')}</div><div class="pbody">${esc(c.content||'')}</div></div>`).join(''):'<div class="pcard"><p style="text-align:center;color:var(--cd);padding:12px;">VIP content coming soon! Admin adds exclusive content. 👑</p></div>'}`;
  }catch{el.innerHTML='<div class="pcard"><p style="text-align:center;color:var(--cd);padding:12px;">VIP content loading... 👑</p></div>';}
}

// ── UTILS ──
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
window.shareItem=function(id){if(navigator.share)navigator.share({title:'Check this on ICONIK',url:location.href});else toast('Link copied! 🔗');};
window.toast=toast;
