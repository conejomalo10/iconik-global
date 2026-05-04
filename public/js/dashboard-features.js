// ═══════════════════════════════════════════════════
// dashboard-features.js
// Celebrities, news, communities, chat, events,
// radio, TV, magazine, wellness, members, ranks, polls
// ═══════════════════════════════════════════════════
async function loadCelebs(){
  var snap=await sg(query(collection(db,"celebrities"),limit(50)));
  allC=[];snap.forEach(function(d){allC.push({id:d.id,...d.data()});});
  renderCelebs(allC);
}
function renderCelebs(list){
  var el=document.getElementById("celebGrid");
  if(!list.length){el.innerHTML="<div style=\"grid-column:span 2;text-align:center;padding:24px;color:var(--muted);\">No celebrities added yet. Admin adds them from the Admin Panel. ⭐</div>";return;}
  var clrs=["#7C3AED","#DC2626","#059669","#D97706","#EC4899","#2563EB","#B45309"];
  var h="";
  list.forEach(function(c){
    // Use stageName if available, fallback to name
    var displayName=c.stageName||c.name||"Celebrity";
    var cl=clrs[Math.abs((displayName).charCodeAt(0))%clrs.length];
    var ph=c.photo||c.photoUrl||c.imageUrl||c.profilePic||c.coverPhoto||"";
    var hp=ph&&ph.startsWith("http");
    var initials=xe(displayName.charAt(0).toUpperCase());
    var isVerified=c.status==="Active"||c.status==="Legend"||c.status==="verified";
    h+="<div class=\"cc\" data-cid=\""+c.id+"\">";
    h+="<div class=\"cthumb\" style=\"background:linear-gradient(135deg,"+cl+"55,"+cl+"22);position:relative;overflow:hidden;\">";
    if(hp){
      h+="<img src=\""+xu(ph)+"\" loading=\"lazy\" crossorigin=\"anonymous\"";
      h+=" style=\"position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top center;z-index:2;\"";
      h+=" onerror=\"this.style.display='none';\"/>";
    }
    h+="<span class=\"cletter\" style=\"position:relative;z-index:1;font-size:2rem;\">"+initials+"</span></div>";
    h+="<div class=\"cinfo\">";
    h+="<div class=\"cnm\">"+xe(displayName)+(isVerified?"<span class=\"badge-verified\"></span>":"")+"</div>";
    h+="<div class=\"ccat\">"+xe(c.category||"")+"</div>";
    h+="<div class=\"cmeta\">"+xe(c.country||"")+(c.followers?" · "+xe(c.followers):"")+"</div>";
    h+="</div></div>";
  });
  el.innerHTML=h;
  document.querySelectorAll(".cc[data-cid]").forEach(function(card){card.onclick=function(){openCeleb(this.dataset.cid);};});
}
function filterCelebs(){var q=document.getElementById("celebSrch").value.toLowerCase();renderCelebs(q?allC.filter(function(c){return(c.name&&c.name.toLowerCase().includes(q))||(c.category&&c.category.toLowerCase().includes(q));}):allC);}

function openCeleb(id){
  var c=allC.find(function(x){return x.id===id;});if(!c)return;
  var clrs=["#7C3AED","#DC2626","#059669","#D97706","#EC4899","#2563EB"];
  var cl=clrs[Math.abs((c.name||"A").charCodeAt(0))%clrs.length];
  var ph2=c.photo||c.photoUrl||c.imageUrl||c.profilePic||"";
  var hp=ph2&&ph2.startsWith("http");
  var ov=mkOv();
  var h=navRow("Celebrity Profile");
  h+="<div style=\"height:240px;background:linear-gradient(135deg,"+cl+"88,"+cl+"22);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;\">";
  if(hp)h+="<img src=\""+xu(ph2)+"\" style=\"position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top center;z-index:2;\" onerror=\"this.style.display='none'\"/>";
  h+="<div style=\"position:absolute;inset:0;background:linear-gradient(to top,rgba(7,7,13,0.95) 0%,transparent 60%);\"></div>";
  h+="<div style=\"position:absolute;bottom:16px;left:16px;right:16px;\">";
  h+="<div style=\"font-size:0.62rem;letter-spacing:0.18em;color:var(--accent);margin-bottom:4px;\">"+xe(c.category||"")+"</div>";
  h+="<div style=\"font-weight:700;font-size:1.4rem;color:#F5F0E8;\">"+xe(c.name||"")+"</div>";
  if(c.stageName)h+="<div style=\"font-size:0.72rem;color:var(--muted);\">"+xe(c.stageName)+"</div>";
  h+="</div></div><div style=\"padding:16px;\">";
  h+="<div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;\">";
  h+="<div class=\"sbox\"><div class=\"snum\" style=\"font-size:0.8rem;\">"+xe(c.followers||"—")+"</div><div class=\"slbl\">Followers</div></div>";
  h+="<div class=\"sbox\"><div class=\"snum\" style=\"font-size:0.8rem;\">"+xe(c.country||"—")+"</div><div class=\"slbl\">Origin</div></div>";
  h+="<div class=\"sbox\"><div class=\"snum\" style=\"font-size:0.8rem;\">"+xe(c.status||"Active")+"</div><div class=\"slbl\">Status</div></div></div>";
  if(c.bio){h+="<div style=\"font-size:0.62rem;letter-spacing:0.18em;color:var(--accent);margin-bottom:8px;\">About</div>";h+="<div class=\"card\"><div style=\"font-size:0.74rem;color:var(--muted);line-height:1.7;\">"+xe(c.bio)+"</div></div>";}
  h+="<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0;\">";
  h+="<button class=\"btn-act\" id=\"fCBtn\">&#11088; Follow</button>";
  h+="<button class=\"btn-gh\" id=\"sCBtn\">&#128279; Share</button></div>";
  h+="<div style=\"font-size:0.62rem;letter-spacing:0.18em;color:var(--accent);margin-bottom:10px;\">Latest Posts</div>";
  h+="<div id=\"cPosts\"><div class=\"loader\"><div class=\"lring\"></div></div></div></div>";
  ov.innerHTML=h;
  attachBack(ov);
  document.getElementById("fCBtn").onclick=async function(){
    if(!cU)return;
    try{await setDoc(doc(db,"follows",cU.uid+"_celeb_"+c.id),{userId:cU.uid,celebId:c.id,celebName:c.name||"",createdAt:serverTimestamp()});}catch{}
    this.textContent="✓ Following";this.style.background="var(--accent-soft)";this.style.color="var(--accent)";this.style.border="1.5px solid var(--accent-glow)";
    toast("Following "+c.name+"!");
  };
  document.getElementById("sCBtn").onclick=function(){
    if(navigator.share)navigator.share({title:(c.name||"")+" on ICONIK",url:location.href});
    else if(navigator.clipboard)navigator.clipboard.writeText(location.href).then(function(){toast("Link copied!");});
  };
  sg(query(collection(db,"posts"),limit(30))).then(function(snap){
    var posts=[];
    snap.forEach(function(d){var p=d.data();if(p.category===c.category)posts.push({id:d.id,...p});});
    posts.sort(function(a,b){return(b.createdAt&&b.createdAt.seconds||0)-(a.createdAt&&a.createdAt.seconds||0);});
    var pEl=document.getElementById("cPosts");if(!pEl)return;
    if(!posts.length){pEl.innerHTML="<div class=\"card\" style=\"text-align:center;color:var(--muted);padding:12px;\">No posts yet for "+xe(c.category||"this community")+".</div>";return;}
    var ph="";
    posts.slice(0,5).forEach(function(p){
      ph+="<div class=\"card\">";
      ph+="<div style=\"font-weight:700;font-size:0.7rem;color:var(--text);margin-bottom:4px;\">"+xe(p.userName||"ICONIK")+"</div>";
      if(p.title)ph+="<div style=\"font-weight:700;font-size:0.88rem;color:var(--text);margin-bottom:4px;\">"+xe(p.title)+"</div>";
      ph+="<div style=\"font-size:0.72rem;color:var(--muted);line-height:1.6;\">"+xe(p.content||"")+"</div>";
      if(p.imageUrl&&p.imageUrl.startsWith("http"))ph+="<img src=\""+xu(p.imageUrl)+"\" style=\"width:100%;border-radius:6px;margin-top:8px;max-height:200px;object-fit:cover;\" onerror=\"this.remove()\"/>";
      ph+="</div>";
    });
    pEl.innerHTML=ph;
  }).catch(function(){});
}

// NEWS
var SNEWS=[
  {title:"Bad Bunny Announces 2026 World Tour",category:"Music",summary:"The Latin superstar announces a massive world tour spanning 5 continents.",icon:"&#127925;",time:"Today"},
  {title:"Champions League — Shock Quarter Finals",category:"Sports",summary:"Unexpected upsets shake the Champions League bracket.",icon:"&#9917;",time:"Yesterday"},
  {title:"New Blockbuster Shatters Opening Records",category:"Film & TV",summary:"A record-breaking opening weekend sets the stage for 2026s biggest film.",icon:"&#127909;",time:"2 days ago"},
  {title:"Paris Fashion Week — Top 10 Looks",category:"Fashion",summary:"Designers unveil their most stunning collections yet.",icon:"&#128247;",time:"3 days ago"},
  {title:"Grammy Nominations — Big Surprises",category:"Music",summary:"This years nominations include several unexpected global artists.",icon:"&#127908;",time:"5 days ago"},
  {title:"Sports Star Signs Historic $500M Deal",category:"Sports",summary:"A landmark deal reshapes professional sports economics globally.",icon:"&#127942;",time:"6 days ago"}
];
async function loadNews(){
  try{var snap=await sg(query(collection(db,"celebrityNews"),limit(20)));if(!snap.empty){allN=[];snap.forEach(function(d){allN.push({id:d.id,...d.data()});});allN.sort(function(a,b){return(b.publishedAt&&b.publishedAt.seconds||0)-(a.publishedAt&&a.publishedAt.seconds||0);});renderNews(allN);return;}}catch{}
  allN=SNEWS;renderNews(allN);
}
function renderNews(list){
  var el=document.getElementById("newsList");
  var h="";
  list.forEach(function(n,i){
    h+="<div class=\"ncard\" data-ni=\""+i+"\">";
    h+="<div class=\"nic\">"+(n.icon||"&#128240;")+"</div>";
    h+="<div style=\"flex:1;\">";
    h+="<div style=\"font-family:'Bebas Neue',sans-serif;font-size:0.54rem;letter-spacing:0.14em;color:var(--accent);margin-bottom:3px;\">"+xe(n.category||"NEWS")+"</div>";
    h+="<div style=\"font-weight:700;font-size:0.82rem;color:var(--text);line-height:1.3;\">"+xe(n.title||"")+"</div>";
    h+="<div style=\"font-size:0.58rem;color:var(--dim);margin-top:3px;\">"+xe(n.time||"")+"</div></div>";
    h+="<div style=\"color:var(--dim);font-size:0.9rem;flex-shrink:0;\">&#8250;</div></div>";
  });
  el.innerHTML=h;
  el.querySelectorAll(".ncard[data-ni]").forEach(function(card){
    card.onclick=function(){
      var n=list[parseInt(this.dataset.ni)];if(!n)return;
      var ov=mkOv();
      var h=navRow(xe(n.category||"News"));
      h+="<div style=\"padding:20px;\">";
      h+="<div style=\"text-align:center;font-size:2.5rem;margin-bottom:12px;\">"+(n.icon||"&#128240;")+"</div>";
      h+="<div style=\"font-size:0.6rem;letter-spacing:0.16em;color:var(--accent);margin-bottom:8px;\">"+xe(n.category||"")+" · "+xe(n.time||"")+"</div>";
      h+="<div style=\"font-weight:700;font-size:1.1rem;color:var(--text);line-height:1.3;margin-bottom:14px;\">"+xe(n.title||"")+"</div>";
      h+="<div style=\"font-size:0.76rem;color:var(--muted);line-height:1.8;\">"+xe(n.summary||n.content||"Full article coming soon.")+"</div></div>";
      ov.innerHTML=h;attachBack(ov);
    };
  });
}

// COMMUNITIES
var COMS=[
  {name:"Music",icon:"&#127925;",desc:"Artists · Albums · Concerts",img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=75"},
  {name:"Film & TV",icon:"&#127909;",desc:"Movies · Series · Directors",img:"https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&q=75"},
  {name:"Sports",icon:"&#9917;",desc:"Football · Basketball · Athletics",img:"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&q=75"},
  {name:"Literature",icon:"&#128218;",desc:"Authors · Books · Knowledge",img:"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&q=75"},
  {name:"Fashion",icon:"&#128247;",desc:"Style · Designers · Trends",img:"https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&q=75"},
  {name:"Fitness & Wellness",icon:"&#128170;",desc:"Health · Fitness · Mind",img:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=75"},
  {name:"Food & Culinary",icon:"&#127869;",desc:"Chefs · Recipes · Culture",img:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=75"},
  {name:"Nature",icon:"&#127807;",desc:"Adventure · Wildlife · Earth",img:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&q=75"},
  {name:"Automotive",icon:"&#128663;",desc:"Cars · Bikes · Lifestyle",img:"https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&q=75"},
  {name:"Tech & Innovation",icon:"&#128187;",desc:"AI · Gadgets · Future",img:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=75"},
  {name:"Beauty",icon:"&#128132;",desc:"Makeup · Skincare · Art",img:"https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&q=75"},
  {name:"Entertainment",icon:"&#127917;",desc:"Comedy · Talent · Shows",img:"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&q=75"},
  {name:"Leadership",icon:"&#127891;",desc:"Vision · Motivation · Growth",img:"https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&q=75"}
];
function loadComs(){
  var j=cD&&cD.categories||[];
  var h="";
  COMS.forEach(function(c){
    var joined=j.some(function(x){return x.toLowerCase().replace(/&/g,"").includes(c.name.toLowerCase().replace(/&/g,""));});
    h+="<div class=\"comcard\">";
    h+="<div class=\"combg\" style=\"background-image:url('"+c.img+"');\"></div>";
    h+="<div class=\"combd\">";
    h+="<div style=\"font-weight:700;font-size:0.66rem;color:var(--text);\">"+c.icon+" "+c.name+(joined?" &#10003;":"")+"</div>";
    h+="<div style=\"font-size:0.52rem;color:var(--dim);\">"+c.desc+"</div></div></div>";
  });
  document.getElementById("comGrid").innerHTML=h;
}

// CHAT
async function loadChat(){
  var el=document.getElementById("chatArea");
  var snap=await sg(query(collection(db,"chat_"+chatRoom),limit(40)));
  var msgs=[];snap.forEach(function(d){msgs.push({id:d.id,...d.data()});});
  msgs.sort(function(a,b){return(a.createdAt&&a.createdAt.seconds||0)-(b.createdAt&&b.createdAt.seconds||0);});
  if(!msgs.length){el.innerHTML="<div style=\"text-align:center;padding:20px;color:var(--dim);\">No messages yet. Say hello!</div>";return;}
  var h="";
  msgs.forEach(function(m){
    var mine=m.userId===cU.uid;
    var t=m.createdAt&&m.createdAt.toDate?m.createdAt.toDate().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"";
    h+="<div class=\"mb"+(mine?" me":"")+"\">";
    h+="<div style=\"width:26px;height:26px;border-radius:50%;background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:0.7rem;flex-shrink:0;\">"+xe((m.name||"?").charAt(0))+"</div>";
    h+="<div><div style=\"font-size:0.56rem;color:var(--dim);margin-bottom:3px;\">"+(mine?"You":xe(m.name||"Fan"))+"</div>";
    h+="<div class=\"mbub\">"+xe(m.text||"")+"</div>";
    h+="<div style=\"font-size:0.5rem;color:var(--dim);margin-top:2px;\">"+t+"</div></div></div>";
  });
  el.innerHTML=h;el.scrollTop=el.scrollHeight;
}
async function sendChat(){
  var inp=document.getElementById("chatInp");var txt=inp.value.trim();if(!txt||!cU)return;inp.value="";
  try{await addDoc(collection(db,"chat_"+chatRoom),{text:txt,name:(cD&&cD.name)||"Fan",userId:cU.uid,createdAt:serverTimestamp()});loadChat();}
  catch{toast("Error sending","error");}
}

// EVENTS
async function loadEvents(){
  var el=document.getElementById("evList");
  try{var snap=await sg(query(collection(db,"events"),limit(20)));if(!snap.empty){var evs=[];snap.forEach(function(d){evs.push({id:d.id,...d.data()});});evs.sort(function(a,b){return(a.eventDate||"").localeCompare(b.eventDate||"");});el.innerHTML=evs.map(evCard).join("");return;}}catch{}
  el.innerHTML=[
    {name:"Bad Bunny — World Tour",venue:"Madison Square Garden, NY",eventDate:"2026-05-15",price:"$85",icon:"&#127925;"},
    {name:"Champions League Final 2026",venue:"Wembley Stadium, London",eventDate:"2026-06-01",price:"$120",icon:"&#9917;"},
    {name:"ICONIK Global Fan Meet",venue:"Virtual + Global Chapters",eventDate:"2026-08-10",price:"Free",icon:"&#127758;"},
    {name:"Met Gala Fan Experience",venue:"Metropolitan Museum, NY",eventDate:"2026-05-05",price:"$45",icon:"&#128247;"}
  ].map(evCard).join("");
}
function evCard(ev){
  var d=new Date(ev.eventDate||"");var mo=isNaN(d)?"TBD":d.toLocaleString("en",{month:"short"}).toUpperCase();var dy=isNaN(d)?"":d.getDate();
  return "<div class=\"card\" style=\"display:flex;gap:12px;align-items:center;\"><div style=\"text-align:center;min-width:38px;\"><div style=\"font-family:'Bebas Neue',sans-serif;font-size:0.54rem;letter-spacing:0.1em;color:var(--accent);\">"+mo+"</div><div style=\"font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--text);line-height:1;\">"+dy+"</div></div><div style=\"flex:1;\"><div style=\"font-weight:700;font-size:0.76rem;color:var(--text);margin-bottom:3px;\">"+xe(ev.name||"")+"</div><div style=\"font-size:0.62rem;color:var(--muted);\">&#128205; "+xe(ev.venue||"")+"</div><div style=\"font-family:'Bebas Neue',sans-serif;font-size:0.7rem;color:var(--accent);margin-top:3px;\">"+xe(ev.price||"")+"</div></div><span style=\"font-size:1.3rem;\">"+(ev.icon||"&#127915;")+"</span></div>";
}

// RADIO — Fixed with real streams + premium design
function loadRadio(){
  var sts=[
    {n:"ICONIK Gold",g:"Top Hits · Global",ic:"🏆",url:"https://stream.zeno.fm/0r0xa792kwzuv"},
    {n:"Afro Beats FM",g:"Afrobeats · Naija · Dancehall",ic:"🥁",url:"https://stream.zeno.fm/muiym1xbhh8uv"},
    {n:"Latin Vibes",g:"Latin · Reggaeton · Urban",ic:"🎸",url:"https://ice4.somafm.com/secretagent-128-mp3"},
    {n:"Hip-Hop Central",g:"Hip-Hop · R&B · Trap",ic:"🎤",url:"https://ice4.somafm.com/groovesalad-128-mp3"},
    {n:"ICONIK Chill",g:"Lo-fi · Ambient · Relaxing",ic:"🌙",url:"https://ice4.somafm.com/dronezone-128-mp3"},
    {n:"Sports Anthems",g:"Rock · EDM · Motivation",ic:"⚽",url:"https://ice4.somafm.com/digitalis-128-mp3"},
    {n:"Gospel & Praise",g:"Gospel · Worship · Praise",ic:"🙏",url:"https://stream.zeno.fm/29eyb3wmjk8uv"},
    {n:"Afropop Paradise",g:"Naija · Highlife · Afropop",ic:"🌍",url:"https://stream.zeno.fm/pn3gvv8jnk8uv"},
  ];
  var h="";
  sts.forEach(function(s,i){
    h+="<div class=\"rcard\" id=\"rcard"+i+"\">";
    h+="<div style=\"width:44px;height:44px;border-radius:12px;background:var(--bg4);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;\">"+s.ic+"</div>";
    h+="<div style=\"flex:1;min-width:0;\">";
    h+="<div style=\"font-family:'Sora',sans-serif;font-weight:700;font-size:0.88rem;color:var(--text);margin-bottom:2px;\">"+xe(s.n)+"</div>";
    h+="<div style=\"font-size:0.7rem;color:var(--text3);\">"+xe(s.g)+"</div></div>";
    h+="<button class=\"rplay\" data-idx=\""+i+"\" data-url=\""+s.url+"\" data-name=\""+xe(s.n)+"\" title=\"Play\">▶</button>";
    h+="</div>";
  });
  var el=document.getElementById("radioList");
  el.innerHTML=h;
  // Audio player
  var audio=document.getElementById("radioAudio")||document.createElement("audio");
  audio.id="radioAudio";audio.preload="none";
  if(!document.getElementById("radioAudio"))document.body.appendChild(audio);
  var curIdx=-1;
  el.addEventListener("click",function(ev){
    var btn=ev.target.closest(".rplay");
    if(!btn)return;
    var idx=parseInt(btn.dataset.idx);
    var url=btn.dataset.url;
    var name=btn.dataset.name;
    if(curIdx===idx&&!audio.paused){
      // Pause
      audio.pause();
      btn.textContent="▶";
      btn.closest(".rcard").classList.remove("playing");
      curIdx=-1;
      toast("Paused: "+name);
      return;
    }
    // Stop previous
    el.querySelectorAll(".rcard").forEach(function(c){c.classList.remove("playing");});
    el.querySelectorAll(".rplay").forEach(function(b){b.textContent="▶";});
    // Play new
    audio.src=url;
    audio.load();
    audio.play().then(function(){
      btn.textContent="⏸";
      btn.closest(".rcard").classList.add("playing");
      curIdx=idx;
      toast("Now playing: "+name+" 🎵");
    }).catch(function(e){
      toast("Stream unavailable — try another station","error");
      console.warn("Radio error:",e);
    });
  });
}

// TV — Real YouTube embeds
function loadTV(){
  var el=document.getElementById("tvList");if(!el)return;
  var vids=[
    {title:"BTS — Permission to Dance (Live)",ch:"HYBE LABELS",id:"CuklIb9d3fI"},
    {title:"Ballon d'Or 2024 Ceremony Highlights",ch:"France Football",id:"kRjht-v_3hk"},
    {title:"Afrobeats Mix 2024 — Best of Naija",ch:"ICONIK Music",id:"LHYY4FxgW5g"},
    {title:"Champions League Best Goals",ch:"UEFA TV",id:"3EGOaMBlvn8"},
    {title:"Drake — Certified Lover Boy",ch:"OVO Sound",id:"TkW_v_4QFXE"},
    {title:"Fashion Week Highlights 2024",ch:"Vogue",id:"M-4gtnRWq7w"},
  ];
  var h="<div style='font-family:Sora,sans-serif;font-size:0.75rem;color:var(--text3);margin-bottom:12px;'>Tap any video to watch · Admin uploads ICONIK content soon</div>";
  // Featured player
  h+="<div style='position:relative;width:100%;padding-top:56.25%;border-radius:14px;overflow:hidden;margin-bottom:12px;box-shadow:0 8px 24px rgba(0,0,0,0.4);'>"
    +"<iframe id='tvFrame' src='https://www.youtube.com/embed/"+vids[0].id+"?rel=0&modestbranding=1' "
    +"style='position:absolute;inset:0;width:100%;height:100%;border:none;' "
    +"allowfullscreen allow='accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture'></iframe></div>";
  h+="<div style='font-family:Sora,sans-serif;font-weight:700;font-size:0.9rem;color:var(--text);margin-bottom:2px;'>"+xe(vids[0].title)+"</div>";
  h+="<div style='font-family:Sora,sans-serif;font-size:0.72rem;color:var(--text3);margin-bottom:14px;'>"+xe(vids[0].ch)+"</div>";
  h+="<div style='font-family:Sora,sans-serif;font-weight:700;font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--text3);margin-bottom:10px;'>Up Next</div>";
  h+="<div style='display:grid;gap:8px;'>";
  vids.slice(1).forEach(function(v){
    h+="<div onclick='document.getElementById(\"tvFrame\").src=\"https://www.youtube.com/embed/"+v.id+"?rel=0&autoplay=1\"' "
      +"style='display:flex;gap:10px;align-items:center;cursor:pointer;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px;transition:border-color 0.15s;' "
      +"onmouseover='this.style.borderColor=\"var(--accent)\"' onmouseout='this.style.borderColor=\"var(--border)\"'>"
      +"<img src='https://img.youtube.com/vi/"+v.id+"/mqdefault.jpg' style='width:80px;height:52px;object-fit:cover;border-radius:7px;flex-shrink:0;' onerror='this.style.background=\"var(--bg4)\";this.src=\"\"'/>"
      +"<div style='flex:1;min-width:0;'><div style='font-family:Sora,sans-serif;font-weight:600;font-size:0.8rem;color:var(--text);margin-bottom:3px;line-height:1.3;'>"+xe(v.title)+"</div>"
      +"<div style='font-family:Sora,sans-serif;font-size:0.68rem;color:var(--text3);'>"+xe(v.ch)+"</div></div>"
      +"<span style='font-size:1.1rem;flex-shrink:0;color:var(--accent);'>▶</span></div>";
  });
  h+="</div>";
  el.innerHTML=h;
}

// MAGAZINE
async function loadMag(){
  var el=document.getElementById("magList");
  try{var snap=await sg(query(collection(db,"magazine"),limit(10)));if(!snap.empty){var a=[];snap.forEach(function(d){a.push({id:d.id,...d.data()});});a.sort(function(x,y){return(y.publishedAt&&y.publishedAt.seconds||0)-(x.publishedAt&&x.publishedAt.seconds||0);});el.innerHTML=a.map(magCard).join("");return;}}catch{}
  el.innerHTML=[{title:"The Rise of Global Fan Culture",category:"Culture",icon:"&#127758;"},{title:"Inside Bad Bunnys Creative Process",category:"Music",icon:"&#127925;"},{title:"Fashion Forward: Icons Shaping Tomorrow",category:"Fashion",icon:"&#128247;"}].map(magCard).join("");
}
function magCard(a){
  return "<div class=\"card\" style=\"display:flex;gap:10px;\"><div style=\"width:60px;height:60px;border-radius:6px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;\">"+(a.icon||"&#128218;")+"</div><div><div style=\"font-weight:700;font-size:0.72rem;color:var(--text);line-height:1.3;margin-bottom:4px;\">"+xe(a.title||"")+"</div><div style=\"font-family:'Bebas Neue',sans-serif;font-size:0.52rem;letter-spacing:0.1em;color:var(--accent);\">"+xe(a.category||"")+"</div></div></div>";
}

// WELLNESS
var WELL={fitness:{t:"Fitness & Training",b:"Build strength and peak performance. Follow certified coaches and elite athletes shaping the fitness world."},nutrition:{t:"Nutrition & Diet",b:"Science-backed nutrition advice and meal plans from certified nutritionists worldwide."},mental:{t:"Mental Wellness",b:"Mindfulness, meditation and mental health. Reduce stress and build resilience with top coaches."},beauty:{t:"Beauty & Skincare",b:"Skincare science, anti-aging and beauty wellness from dermatologists and beauty icons."},recovery:{t:"Sports Recovery",b:"Recovery science for athletes — physiotherapy, sleep optimization and injury prevention."}};
function loadWell(tab){var w=WELL[tab]||WELL.fitness;document.getElementById("wellContent").innerHTML="<div class=\"card\"><div style=\"font-weight:700;font-size:0.95rem;color:var(--text);margin-bottom:8px;\">"+w.t+"</div><div style=\"font-size:0.72rem;color:var(--muted);line-height:1.6;\">"+w.b+"</div></div><div class=\"card\" style=\"text-align:center;color:var(--muted);padding:12px;\">Admin adds coaches and partners from the Admin Panel.</div>";}

// FIND MEMBERS
async function loadMembers(){
  var snap=await sg(query(collection(db,"users"),limit(50)));
  allM=[];snap.forEach(function(d){if(d.id!==cU.uid)allM.push({id:d.id,...d.data()});});
  renderMembers(allM);
}
function renderMembers(list){
  var el=document.getElementById("memberList");
  if(!list.length){el.innerHTML="<div class=\"card\" style=\"text-align:center;color:var(--muted);padding:14px;\">No members found.</div>";return;}
  var h="";
  list.slice(0,30).forEach(function(m){
    h+="<div class=\"mcard\" data-mid=\""+m.id+"\">";
    h+="<div class=\"mav\">";
    var _pic=m.profilePic||m.photoURL||m.photo||m.avatar||"";
    if(_pic&&_pic.startsWith("http"))h+="<img src=\""+xu(_pic)+"\" style=\"width:100%;height:100%;object-fit:cover;border-radius:50%;\" onerror=\"this.remove()\"/>";
    else h+=xe((m.name||"?").charAt(0).toUpperCase());
    h+="</div><div style=\"flex:1;min-width:0;\">";
    h+="<div style=\"font-weight:700;font-size:0.74rem;color:var(--text);\">"+xe(m.name||"Member")+(m.verificationStatus==="verified"?"<span class=\"badge-verified\"></span>":"")+"</div>";
    h+="<div style=\"font-size:0.6rem;color:var(--dim);\">"+(m.city?xe(m.city)+", ":"")+xe(m.country||"—")+" · <span style=\"color:var(--accent);\">"+xe(m.tier||"Fan")+"</span></div>";
    var cats=m.categories||[];if(cats.length){h+="<div style=\"display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;\">";cats.slice(0,3).forEach(function(c){h+="<span style=\"font-size:0.48rem;color:var(--bg);background:var(--accent);padding:1px 5px;\">"+xe(c)+"</span>";});h+="</div>";}
    h+="</div><div style=\"color:var(--dim);font-size:0.9rem;\">&#8250;</div></div>";
  });
  el.innerHTML=h;
  el.querySelectorAll(".mcard[data-mid]").forEach(function(card){card.onclick=function(){var m=allM.find(function(x){return x.id===this.dataset.mid;}.bind(this));if(m)openMember(m);};});
}
function filterMembers(){
  var q=document.getElementById("mSrch").value.toLowerCase();
  var cat=document.getElementById("mFilt").value;
  var r=allM;
  if(q)r=r.filter(function(m){return(m.name&&m.name.toLowerCase().includes(q))||(m.country&&m.country.toLowerCase().includes(q));});
  if(cat)r=r.filter(function(m){return(m.categories||[]).some(function(c){return c.toLowerCase().includes(cat.toLowerCase());});});
  renderMembers(r);
}
async function openMember(m){
  var ci={"Music":"&#127925;","Film & TV":"&#127909;","Sports":"&#9917;","Literature":"&#128218;","Fitness & Wellness":"&#128170;","Nature":"&#127807;","Fashion":"&#128247;","Food & Culinary":"&#127869;","Automotive":"&#128663;","Tech & Innovation":"&#128187;","Beauty":"&#128132;","Leadership":"&#127891;","Entertainment":"&#127917;"};
  var ov=mkOv();
  var h=navRow("Member Profile");
  h+="<div style=\"height:160px;background:linear-gradient(135deg,#1a0e00,#2d1a08,#0a0a18);position:relative;overflow:hidden;\">";
  if(m.coverPhoto&&m.coverPhoto.startsWith("http"))h+="<img src=\""+xu(m.coverPhoto)+"\" style=\"width:100%;height:100%;object-fit:cover;\" onerror=\"this.remove()\"/>";
  h+="</div>";
  h+="<div style=\"padding:0 16px;display:flex;align-items:flex-end;justify-content:space-between;min-height:50px;margin-bottom:10px;\">";
  h+="<div style=\"width:82px;height:82px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--bg);border:4px solid var(--bg);overflow:hidden;flex-shrink:0;margin-top:-50px;position:relative;z-index:5;\">";
  var _pic2=m.profilePic||m.photoURL||m.photo||m.avatar||"";
  if(_pic2&&_pic2.startsWith("http"))h+="<img src=\""+xu(_pic2)+"\" style=\"width:100%;height:100%;object-fit:cover;border-radius:50%;\" onerror=\"this.remove()\"/>";
  else h+=xe((m.name||"?").charAt(0).toUpperCase());
  h+="</div>";
  // ── ACTION BUTTONS — compact row ──
  // Check friend status
  var isFr=false;
  try{var frSnap=await getDoc(doc(db,"friends",cU.uid+"_"+m.id));isFr=frSnap.exists();}catch(e){}
  h+="<div style=\"display:flex;gap:6px;padding-bottom:4px;flex-wrap:wrap;\">";
  h+="<button class=\"btn-act\" id=\"fMBtn\" style=\"flex:1;padding:9px 6px;font-size:0.78rem;\">+ Follow</button>";
  h+=(isFr
    ?"<button class=\"btn-gh\" id=\"frBtn\" style=\"flex:1;padding:9px 6px;font-size:0.78rem;background:rgba(10,132,255,0.12);border:1px solid #0A84FF;color:#0A84FF;\">✓ Friends</button>"
    :"<button class=\"btn-gh\" id=\"frBtn\" style=\"flex:1;padding:9px 6px;font-size:0.78rem;\">+ Friend</button>");
  h+="<button class=\"btn-gh\" id=\"sMBtn\" style=\"flex:1;padding:9px 6px;font-size:0.78rem;\">🔗 Share</button>";
  h+="<button id=\"blockMBtn\" style=\"flex:1;padding:9px 6px;background:rgba(255,59,48,0.07);border:1.5px solid rgba(255,59,48,0.25);border-radius:var(--radius-sm);cursor:pointer;font-family:'Sora',sans-serif;font-size:0.78rem;font-weight:700;color:var(--err);transition:all 0.2s;\">🚫 Block</button>";
  h+="</div></div>";
  h+="<div style=\"padding:0 16px 24px;\">";
  // Name + verified badge + VIP medal — side by side
  h+="<div style=\"font-family:'Sora',sans-serif;font-weight:800;font-size:1.15rem;color:var(--text);margin-bottom:6px;letter-spacing:-0.02em;display:flex;align-items:center;gap:6px;flex-wrap:wrap;\">"+xe(m.name||"Member")+(m.verificationStatus==="verified"?"<span class=\"badge-verified\"></span>":"")+getTierBadge(m.tier)+"</div>";
  h+="<div style=\"font-family:'Sora',sans-serif;font-size:0.78rem;color:var(--text3);margin-bottom:14px;\">&#128205; "+(m.city?xe(m.city)+", ":"")+xe(m.country||"—")+"</div>";
  if(m.bio)h+="<div style=\"font-size:0.74rem;color:var(--muted);line-height:1.7;margin-bottom:14px;\">"+xe(m.bio)+"</div>";
  h+="<div style=\"display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:16px;\">";
  h+="<div class=\"sbox\"><div class=\"snum\">"+(m.followersCount||m.followers||0)+"</div><div class=\"slbl\">Followers</div></div>";
  h+="<div class=\"sbox\"><div class=\"snum\">"+(m.followingCount||m.following||0)+"</div><div class=\"slbl\">Following</div></div>";
  h+="<div class=\"sbox\"><div class=\"snum\">"+(m.postCount||m.posts||0)+"</div><div class=\"slbl\">Posts</div></div>";
  h+="<div class=\"sbox\"><div class=\"snum\">"+(m.friendsCount||0)+"</div><div class=\"slbl\">Friends</div></div></div>";
  h+="<div style=\"font-size:0.62rem;letter-spacing:0.18em;color:var(--accent);margin-bottom:10px;\">Communities</div>";
  h+="<div style=\"display:flex;gap:6px;flex-wrap:wrap;\">";
  var cats=m.categories||[];
  if(cats.length){cats.forEach(function(c){h+="<div style=\"background:var(--card);border:1px solid var(--border);padding:7px 11px;border-radius:6px;font-size:0.64rem;color:var(--text);\">"+(ci[c]||"&#127775;")+" "+xe(c)+"</div>";});}
  else h+="<span style=\"color:var(--dim);font-size:0.7rem;\">No communities listed</span>";
  h+="</div></div>";
  ov.innerHTML=h;attachBack(ov);
  // Block handler
  document.getElementById("blockMBtn").onclick=async function(){
    var btn=this;
    var isBlocked=btn.textContent.includes("Unblock");
    if(!isBlocked){
      if(!confirm("Block "+xe(m.name||"this member")+"? They won't be able to see your profile or posts."))return;
      try{
        await setDoc(doc(db,"blocks",cU.uid+"_"+m.id),{
          blockerId:cU.uid,blockedId:m.id,
          blockedName:m.name||"",createdAt:serverTimestamp()
        });
        btn.textContent="✅ Unblock";
        btn.style.background="rgba(10,132,255,0.07)";
        btn.style.color="var(--accent)";
        btn.style.borderColor="rgba(10,132,255,0.25)";
        toast(xe(m.name||"Member")+" blocked 🚫");
      }catch(e){toast("Error blocking","error");}
    }else{
      try{
        await deleteDoc(doc(db,"blocks",cU.uid+"_"+m.id));
        btn.textContent="🚫 Block";
        btn.style.background="rgba(255,59,48,0.07)";
        btn.style.color="var(--err)";
        btn.style.borderColor="rgba(255,59,48,0.25)";
        toast(xe(m.name||"Member")+" unblocked ✅");
      }catch(e){toast("Error unblocking","error");}
    }
  };
  // Share profile handler
  var shareMBtn=document.getElementById("shareMBtn");
  if(shareMBtn)shareMBtn.onclick=function(){
    doShare((m.name||"Member")+" on ICONIK","Check out "+(m.name||"this member")+" on ICONIK!","https://iconik-global.web.app");
  };
  document.getElementById("fMBtn").onclick=async function(){
    if(!cU)return;
    try{await setDoc(doc(db,"follows",cU.uid+"_"+m.id),{followerId:cU.uid,followingId:m.id,createdAt:serverTimestamp()});}catch{}
    this.textContent="✓ Following";this.style.background="var(--accent-soft)";this.style.color="var(--accent)";this.style.border="1.5px solid var(--accent-glow)";
    toast("Following "+xe(m.name||"Member")+"!");
  };
  document.getElementById("sMBtn").onclick=function(){
    if(navigator.share)navigator.share({title:xe(m.name||"Member")+" on ICONIK",url:location.href});
    else if(navigator.clipboard)navigator.clipboard.writeText(location.href).then(function(){toast("Link copied!");});
  };
  // Friend button handler
  var frBtn=document.getElementById("frBtn");
  if(frBtn){
    frBtn.onclick=async function(){
      var btn=this;
      var alreadyFriend=btn.textContent.includes("✓");
      if(alreadyFriend){
        try{
          await deleteDoc(doc(db,"friends",cU.uid+"_"+m.id));
          await deleteDoc(doc(db,"friends",m.id+"_"+cU.uid));
          btn.textContent="+ Friend";
          btn.style.background="";btn.style.color="";btn.style.borderColor="";
          toast("Friend removed");
        }catch(e){toast("Error: "+e.message,"error");}
      }else{
        try{
          await setDoc(doc(db,"friends",cU.uid+"_"+m.id),{uid1:cU.uid,uid2:m.id,name2:xe(m.name||"Member"),createdAt:serverTimestamp()});
          await setDoc(doc(db,"friends",m.id+"_"+cU.uid),{uid1:m.id,uid2:cU.uid,name2:xe((cD&&cD.name)||"Member"),createdAt:serverTimestamp()});
          btn.textContent="✓ Friends";
          btn.style.background="rgba(10,132,255,0.12)";btn.style.color="#0A84FF";btn.style.borderColor="#0A84FF";
          toast("Friend added! 🤝","success");
        }catch(e){toast("Error: "+e.message,"error");}
      }
    };
  }
}

// RANKINGS
async function loadRanks(){
  var el=document.getElementById("rankList");
  var snap=await sg(query(collection(db,"users"),limit(20)));
  var us=[];snap.forEach(function(d){us.push({id:d.id,...d.data()});});
  us.sort(function(a,b){return(b.points||0)-(a.points||0);});
  var md=["&#129351;","&#129352;","&#129353;"];
  var h="";
  us.forEach(function(u,i){
    h+="<div class=\"card\" style=\"display:flex;align-items:center;gap:10px;\">";
    h+="<div style=\"font-family:'Bebas Neue',sans-serif;font-size:1rem;color:var(--dim);width:22px;text-align:center;\">"+(i<3?md[i]:i+1)+"</div>";
    h+="<div class=\"mav\" style=\"width:36px;height:36px;font-size:0.9rem;\">"+xe((u.name||"?").charAt(0))+"</div>";
    h+="<div style=\"flex:1;\"><div style=\"font-weight:700;font-size:0.72rem;color:var(--text);\">"+xe(u.name||"Member")+"</div><div style=\"font-size:0.6rem;color:var(--dim);\">"+xe(u.country||"—")+"</div></div>";
    h+="<div style=\"font-family:'Bebas Neue',sans-serif;font-size:0.8rem;color:var(--accent);\">"+(u.points||0)+" pts</div></div>";
  });
  el.innerHTML=h||"<div class=\"card\" style=\"text-align:center;color:var(--muted);padding:12px;\">Earn points by posting and engaging!</div>";
}

// POLLS
async function loadPolls(){
  var el=document.getElementById("pollList");
  try{var snap=await sg(query(collection(db,"polls"),limit(10)));if(!snap.empty){var p=[];snap.forEach(function(d){p.push({id:d.id,...d.data()});});renderPolls(p);return;}}catch{}
  renderPolls([{id:"p1",question:"Who should ICONIK partner with next?",options:["Bad Bunny","Beyonce","Cristiano Ronaldo","BTS"],totalVotes:247},{id:"p2",question:"Which community should ICONIK add?",options:["Gaming","K-Drama","Comedy","Anime"],totalVotes:183}]);
}
function renderPolls(polls){
  var el=document.getElementById("pollList");
  var h="";
  polls.forEach(function(p){
    h+="<div class=\"card\" style=\"margin-bottom:12px;\">";
    h+="<div style=\"font-weight:700;font-size:0.88rem;color:var(--text);margin-bottom:12px;line-height:1.35;\">"+xe(p.question||"")+"</div>";
    (p.options||[]).forEach(function(opt){
      h+="<div style=\"margin-bottom:7px;\"><button data-poll=\""+p.id+"\" data-opt=\""+xe(opt)+"\" style=\"width:100%;padding:9px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:0.7rem;font-weight:600;text-align:left;cursor:pointer;\">"+xe(opt)+"</button></div>";
    });
    h+="<div style=\"font-size:0.6rem;color:var(--dim);margin-top:6px;\">"+(p.totalVotes||0)+" votes</div></div>";
  });
  el.innerHTML=h;
  el.addEventListener("click",async function(ev){
    var btn=ev.target.closest("[data-poll]");if(!btn)return;
    btn.style.borderColor="var(--accent)";btn.style.color="var(--accent)";
    toast("Voted for "+btn.dataset.opt+"!");
    if(cU)try{await setDoc(doc(db,"votes",cU.uid+"_"+btn.dataset.poll),{userId:cU.uid,pollId:btn.dataset.poll,option:btn.dataset.opt,createdAt:serverTimestamp()});}catch{}
  });
}

// PROFILE
