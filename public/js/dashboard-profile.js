// ═══════════════════════════════════════════════════
// dashboard-profile.js
// Profile, messages, notifications, VIP, FAB
// ═══════════════════════════════════════════════════
function loadProfile(){
  if(!cD){setTimeout(loadProfile,500);return;}
  var nm=xe(cD.name||"Member");
  var h="";
  h+="<div style=\"height:180px;background:linear-gradient(135deg,#1a0e00,#2d1a08,#0a0a18);position:relative;overflow:hidden;border-radius:8px;margin-bottom:14px;cursor:pointer;\" onclick=\"document.getElementById('covF').click()\">";
  if(cD.coverPhoto&&cD.coverPhoto.startsWith("http"))h+="<img src=\""+xu(cD.coverPhoto)+"\" style=\"position:absolute;inset:0;width:100%;height:100%;object-fit:cover;\" onerror=\"this.style.display='none'\"/>";
  h+="<div style=\"position:absolute;bottom:10px;right:12px;background:rgba(0,0,0,0.5);border-radius:20px;padding:5px 11px;font-family:'Montserrat',sans-serif;font-size:0.62rem;color:#fff;cursor:pointer;\">📸 Change Cover</div>";
  h+="</div>";
  h+="<div style=\"display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:14px;margin-top:-54px;padding:0 4px;\">";
  h+="<div style=\"position:relative;cursor:pointer;\" onclick=\"document.getElementById('picF').click()\">";
  h+="<div style=\"width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:2.2rem;color:var(--bg);border:4px solid var(--bg);overflow:hidden;flex-shrink:0;position:relative;z-index:5;box-shadow:0 4px 16px rgba(0,0,0,0.4);\">";
  if(cD.profilePic&&cD.profilePic.startsWith("http"))h+="<img src=\""+xu(cD.profilePic)+"\" style=\"position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%;\" onerror=\"this.style.display='none'\"/>";
  h+=(cD.name||"M").charAt(0).toUpperCase();
  h+="</div><div style=\"position:absolute;bottom:2px;right:2px;width:26px;height:26px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:0.7rem;border:2px solid var(--bg);z-index:6;\">📷</div></div>";
  h+="</div>";
  h+="<div style=\"padding-bottom:4px;\">"+getTierBadge(cD.tier)+"</div></div>";
  h+="<div style=\"font-weight:700;font-size:1.1rem;color:var(--text);margin-bottom:4px;\">"+nm+(cD.verificationStatus==="verified"?"<span class=\"badge-verified\"></span>":"")+"</div>";
  if(cD.bio)h+="<div style=\"font-size:0.72rem;color:var(--muted);line-height:1.6;margin-bottom:12px;\">"+xe(cD.bio)+"</div>";
  h+="<div style=\"display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:16px;\">";
  h+="<div class=\"sbox\"><div class=\"snum\">"+(cD.followersCount||cD.followers||0)+"</div><div class=\"slbl\">Followers</div></div>";
  h+="<div class=\"sbox\"><div class=\"snum\">"+(cD.followingCount||cD.following||0)+"</div><div class=\"slbl\">Following</div></div>";
  h+="<div class=\"sbox\"><div class=\"snum\">"+(cD.postCount||0)+"</div><div class=\"slbl\">Posts</div></div>";
  h+="<div class=\"sbox\"><div class=\"snum\">"+(cD.points||0)+"</div><div class=\"slbl\">Points</div></div></div>";
  h+="<div class=\"sh2\">Edit Profile</div><div class=\"card\">";
  h+="<div class=\"fg\"><label class=\"fl\">Bio</label><textarea class=\"fi\" id=\"eBio\" rows=\"3\" placeholder=\"Tell the community about yourself...\">"+xe(cD.bio||"")+"</textarea></div>";
  h+="<div class=\"fg\"><label class=\"fl\">Profile Picture</label><div class=\"upbox\" id=\"picBox\"><div style=\"font-size:1.3rem;margin-bottom:4px;\">&#128247;</div><div id=\"picFnm\" style=\"font-size:0.64rem;color:var(--muted);\">Tap to upload profile picture</div><input type=\"file\" id=\"picF\" accept=\"image/*\" style=\"display:none;\"/></div><input class=\"fi\" id=\"ePic\" placeholder=\"Or paste URL: https://...\" value=\""+xu(cD.profilePic||"")+"\"/></div>";
  h+="<div class=\"fg\"><label class=\"fl\">Cover Photo</label><div class=\"upbox\" id=\"covBox\"><div style=\"font-size:1.3rem;margin-bottom:4px;\">&#128444;</div><div id=\"covFnm\" style=\"font-size:0.64rem;color:var(--muted);\">Tap to upload cover photo</div><input type=\"file\" id=\"covF\" accept=\"image/*\" style=\"display:none;\"/></div><input class=\"fi\" id=\"eCov\" placeholder=\"Or paste URL: https://...\" value=\""+xu(cD.coverPhoto||"")+"\"/></div>";
  h+="<button class=\"btn-g\" id=\"saveBtn\">Save Profile &#8594;</button></div>";
  h+="<div class=\"sh2\">My Communities</div><div style=\"display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;\">";
  (cD.categories||[]).forEach(function(c){h+="<div style=\"background:var(--card);border:1px solid var(--border);padding:7px 11px;border-radius:6px;font-size:0.64rem;color:var(--text);\">"+xe(c)+"</div>";});
  h+="</div>";
  document.getElementById("profileContent").innerHTML=h;
  document.getElementById("picBox").onclick=function(){document.getElementById("picF").click();};
  document.getElementById("covBox").onclick=function(){document.getElementById("covF").click();};
  document.getElementById("picF").onchange=function(){document.getElementById("picFnm").textContent=this.files[0]?this.files[0].name:"File selected";};
  document.getElementById("covF").onchange=function(){document.getElementById("covFnm").textContent=this.files[0]?this.files[0].name:"File selected";};
  document.getElementById("saveBtn").onclick=saveProfile;
}
async function saveProfile(){
  if(!cU)return;
  var btn=document.getElementById("saveBtn");btn.disabled=true;btn.textContent="Saving...";
  try{
    var bio=document.getElementById("eBio").value.trim();
    var pic=document.getElementById("ePic").value.trim()||(cD&&cD.profilePic)||"";
    var cov=document.getElementById("eCov").value.trim()||(cD&&cD.coverPhoto)||"";
    var pf=document.getElementById("picF").files[0];
    var cf=document.getElementById("covF").files[0];
    if(pf)try{pic=await upload(pf);}catch{}
    if(cf)try{cov=await upload(cf);}catch{}
    await setDoc(doc(db,"users",cU.uid),{bio:bio,profilePic:pic,coverPhoto:cov},{merge:true});
    if(cD){cD.bio=bio;cD.profilePic=pic;cD.coverPhoto=cov;}
    var av=document.getElementById("navAv");av.textContent=(cD.name||"M").charAt(0).toUpperCase();
    if(pic){var img=document.createElement("img");img.src=pic;img.onerror=function(){this.remove();};av.appendChild(img);}
    toast("Profile saved!");loadProfile();
  }catch{toast("Error saving","error");}
  btn.disabled=false;btn.textContent="Save Profile &#8594;";
}

// MESSAGES
async function loadMsgs(){
  var el=document.getElementById("msgList");
  var snap=await sg(query(collection(db,"messages"),limit(20)));
  var ms=[];snap.forEach(function(d){ms.push({id:d.id,...d.data()});});
  ms.sort(function(a,b){return(b.createdAt&&b.createdAt.seconds||0)-(a.createdAt&&a.createdAt.seconds||0);});
  if(!ms.length){el.innerHTML="<div class=\"card\" style=\"text-align:center;color:var(--muted);padding:12px;\">No messages yet. &#128233;</div>";return;}
  var h="";
  ms.forEach(function(m){
    h+="<div class=\"card\"><div style=\"display:flex;align-items:center;gap:8px;margin-bottom:6px;\">";
    h+="<span style=\"font-weight:700;font-size:0.74rem;color:var(--text);\">"+xe(m.fromName||"ICONIK")+"</span>";
    h+="<span style=\"font-family:'Bebas Neue',sans-serif;font-size:0.5rem;color:var(--bg);background:var(--accent);padding:1px 6px;\">"+xe(m.fromRole||"ADMIN")+"</span>";
    h+="<span style=\"font-size:0.56rem;color:var(--dim);margin-left:auto;\">"+(m.createdAt&&m.createdAt.toDate?m.createdAt.toDate().toLocaleDateString():"")+"</span></div>";
    if(m.subject)h+="<div style=\"font-weight:700;font-size:0.74rem;color:var(--text);margin-bottom:5px;\">"+xe(m.subject)+"</div>";
    h+="<div style=\"font-size:0.72rem;color:var(--muted);line-height:1.6;\">"+xe(m.content||"")+"</div></div>";
  });
  el.innerHTML=h;
}

// NOTIFICATIONS
async function loadNotifs(){
  var el=document.getElementById("notifList");
  var items=[
    {icon:cD&&cD.verificationStatus==="verified"?"&#9989;":"&#8987;",title:cD&&cD.verificationStatus==="verified"?"Account Verified!":"Verification Pending",body:cD&&cD.verificationStatus==="verified"?"Your identity is confirmed.":"Admin is reviewing your account.",unread:!cD||cD.verificationStatus!=="verified"},
    {icon:"&#127775;",title:"Welcome to ICONIK!",body:"You are part of "+((cD&&cD.categories)||[]).length+" fan communities.",unread:false}
  ];
  try{var snap=await sg(query(collection(db,"notifications"),limit(10)));snap.forEach(function(d){var n=d.data();items.unshift({icon:"&#128276;",title:n.message||"New notification",body:n.fromName?"From "+n.fromName:"",unread:true});});}catch{}
  var h="";
  items.forEach(function(n){
    h+="<div class=\"card\" style=\""+(n.unread?"border-left:3px solid var(--accent);":"")+"display:flex;gap:10px;\">";
    h+="<span style=\"font-size:1.1rem;flex-shrink:0;\">"+n.icon+"</span>";
    h+="<div><div style=\"font-weight:700;font-size:0.72rem;color:var(--text);margin-bottom:2px;\">"+xe(n.title)+"</div>";
    h+="<div style=\"font-size:0.64rem;color:var(--muted);\">"+xe(n.body)+"</div></div></div>";
  });
  el.innerHTML=h;
}

// VIP — Premium Blue Glassmorphism
async function loadVIP(){
  var vipEl=document.getElementById("vipV");
  if(!vipEl)return;
  var tier=(cD&&cD.tier)||"Fan";
  var isVIP=tier.toLowerCase().includes("silver")||tier.toLowerCase().includes("gold")||tier.toLowerCase().includes("bronze");
  var vipContent=vipEl.querySelector("#vipContent");
  var heroDiv=vipEl.querySelector("#vipHero");
  if(heroDiv){
    heroDiv.innerHTML="<div style='background:linear-gradient(135deg,rgba(10,132,255,0.92),rgba(0,80,180,0.88),rgba(6,30,80,0.97));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(10,132,255,0.45);border-radius:16px;padding:28px 20px;text-align:center;box-shadow:0 8px 32px rgba(10,132,255,0.35);'>"
      +"<div style='font-size:2.5rem;margin-bottom:8px;'>💎</div>"
      +"<div style='font-family:Sora,sans-serif;font-weight:900;font-size:1.5rem;color:#fff;margin-bottom:6px;letter-spacing:-0.02em;'>VIP Inner Circle</div>"
      +"<div style='font-family:Sora,sans-serif;font-size:0.82rem;color:rgba(255,255,255,0.75);margin-bottom:16px;'>Your exclusive access to the world's fan elite</div>"
      +(isVIP?"<div style='display:inline-block;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3);border-radius:20px;padding:6px 18px;font-family:Sora,sans-serif;font-size:0.78rem;font-weight:700;color:#fff;'>✓ Active — "+xe(tier)+"</div>"
      :"<button style='background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.4);color:#fff;font-family:Sora,sans-serif;font-weight:700;font-size:0.82rem;padding:10px 24px;border-radius:10px;cursor:pointer;' onclick=\"window.sv('membership')\">Upgrade to VIP →</button>")
      +"</div>";
  }
  var tiers=[
    {cls:"tier-bronze",icon:"🥉",name:"VIP Bronze",price:"$5/mo",perks:["Priority support","Exclusive posts","Early event access"]},
    {cls:"tier-silver",icon:"🥈",name:"VIP Silver",price:"$12/mo",perks:["All Bronze perks","💕 Dating & Matchmaking","Creator Fund access","VIP chat rooms"]},
    {cls:"tier-gold",icon:"🥇",name:"VIP Gold",price:"$25/mo",perks:["All Silver perks","◈ 10% commission earnings","$10 monthly cashback","Direct celebrity messaging","Top fan ranking priority"]},
  ];
  var tiersHtml=tiers.map(function(t){
    return"<div class='card' style='margin-bottom:10px;border:1.5px solid var(--border2);'>"
      +"<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;'>"
      +"<div style='display:flex;align-items:center;gap:10px;'><span style='font-size:1.4rem;'>"+t.icon+"</span>"
      +"<div><div class='"+t.cls+"'>"+xe(t.name)+"</div>"
      +"<div style='font-family:Sora,sans-serif;font-weight:800;font-size:1rem;color:var(--text);margin-top:4px;'>"+xe(t.price)+"</div></div></div>"
      +"<button class='btn-act' style='width:auto;padding:8px 16px;font-size:0.72rem;' onclick=\"window.sv('membership')\">Get</button></div>"
      +"<ul style='list-style:none;display:flex;flex-direction:column;gap:6px;'>"
      +t.perks.map(function(p){return"<li style='font-family:Sora,sans-serif;font-size:0.8rem;color:var(--text2);display:flex;align-items:center;gap:8px;'><span style='color:var(--accent);'>✓</span>"+xe(p)+"</li>";}).join("")
      +"</ul></div>";
  }).join("");
  if(vipContent){
    vipContent.innerHTML=tiersHtml
      +"<div class='card' style='background:rgba(255,59,48,0.06);border-color:rgba(255,59,48,0.2);'>"
      +"<div style='font-family:Sora,sans-serif;font-size:0.62rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--err);margin-bottom:6px;'>⚠️ Beware of Scams</div>"
      +"<div style='font-family:Sora,sans-serif;font-size:0.78rem;color:var(--text2);line-height:1.6;'>Only subscribe on the official ICONIK website. Ignore anyone offering cheap verification outside the app — they are fake.</div>"
      +"</div>";
  }
}

window.toast=toast;

