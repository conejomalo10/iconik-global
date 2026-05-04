// ═══════════════════════════════════════════════════
// dashboard-core.js
// Auth, helpers, boot, feed, posts, stories
// ═══════════════════════════════════════════════════

import{initializeApp}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import{getAuth,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import{getFirestore,collection,doc,setDoc,getDoc,getDocs,addDoc,updateDoc,deleteDoc,query,limit,serverTimestamp}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const cfg={apiKey:"AIzaSyCnX9DszicduSwsFwBZ_iTLI47NPeXkteE",authDomain:"iconik-global.firebaseapp.com",projectId:"iconik-global",storageBucket:"iconik-global.firebasestorage.app",messagingSenderId:"1040054516979",appId:"1:1040054516979:web:33cd5f07ae8fc146a30b86"};
const fb=initializeApp(cfg),auth=getAuth(fb),db=getFirestore(fb);
async function sg(r){try{return await getDocs(r);}catch(e){console.warn("Firestore:",e.message);return{empty:true,forEach:()=>{},docs:[],size:0};}}
function xe(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function xu(s){return String(s||"").replace(/"/g,"'");}
function toast(msg,t){var el=document.getElementById("toast");el.textContent=msg;el.style.background=t==="error"?"rgba(127,29,29,0.97)":t==="info"?"rgba(30,58,95,0.97)":"rgba(20,83,45,0.97)";el.classList.add("on");clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove("on");},3000);}
async function upload(f){var fd=new FormData();fd.append("file",f);fd.append("upload_preset","iconik_uploads");var r=await fetch("https://api.cloudinary.com/v1_1/dhazrf2xr/upload",{method:"POST",body:fd});if(!r.ok)throw new Error("Upload failed");return(await r.json()).secure_url;}
function mkOv(){var o=document.createElement("div");o.className="ov";document.body.appendChild(o);return o;}
function navRow(title){return "<div class=\"ov-nav\"><button class=\"back-btn\" id=\"ovBack\">&#8592;</button><span style=\"font-size:0.72rem;letter-spacing:0.16em;color:var(--muted);\">"+title+"</span></div>";}
let cU=null,cD=null,allC=[],allM=[],allN=[],chatRoom="general",cTick=null;
window._so=async function(){await signOut(auth);location.replace("/app.html?signout=1");};
onAuthStateChanged(auth,async function(u){
  if(!u){location.replace("/app.html");return;}
  cU=u;
  try{
    var d=await getDoc(doc(db,"users",u.uid));
    if(d.exists()){
      cD={id:d.id,...d.data()};
    } else {
      // Auto-create user profile on first login (only if not exists)
      var np={name:u.displayName||u.email.split("@")[0]||"Member",email:u.email||"",profilePic:u.photoURL||"",bio:"",tier:"Fan",privacy:{profilePic:"public",coverPhoto:"public",posts:"public",status:"public"},followers:0,following:0,posts:0,joinedAt:serverTimestamp(),uid:u.uid};
      try{await setDoc(doc(db,"users",u.uid),np);cD={id:u.uid,...np};}catch(se){console.log("Profile create error:",se.message);}
    }
  }catch(e){console.log("Auth error:",e);}
  boot();
});
function getTierBadge(tier){
  var t=(tier||"Fan").toLowerCase();
  if(t==="gold")return "<span class=\'sb-ti gold\'>🥇 VIP Gold</span>";
  if(t==="silver")return "<span class=\'sb-ti silver\'>🥈 VIP Silver</span>";
  if(t==="bronze")return "<span class=\'sb-ti bronze\'>🥉 VIP Bronze</span>";
  return "<span class=\'sb-ti fan\'>Fan</span>";
}
function boot(){
  var nm=cD&&cD.name?cD.name:"Member";
  var av=document.getElementById("navAv");av.textContent=nm.charAt(0).toUpperCase();
  if(cD&&cD.profilePic&&cD.profilePic.startsWith("http")){var img=document.createElement("img");img.src=cD.profilePic;img.onerror=function(){this.remove();};av.appendChild(img);}
  document.getElementById("sbNm").textContent=nm;
  var t2=(cD&&cD.tier)||"Fan";
  var tc=t2.toLowerCase().includes("gold")?"tier-gold":t2.toLowerCase().includes("silver")?"tier-silver":t2.toLowerCase().includes("bronze")?"tier-bronze":"tier-fan";
  var sTi=document.getElementById("sbTi");
  if(sTi){sTi.className="sb-ti "+tc;sTi.textContent=t2;}
  document.getElementById("postAv").textContent=nm.charAt(0).toUpperCase();
  ["composerBar","pbtn1","pbtn2","pbtn3"].forEach(function(id){var el=document.getElementById(id);if(el)el.onclick=openComposer;});
  document.getElementById("celebSrch").addEventListener("input",filterCelebs);
  document.getElementById("mSrch").addEventListener("input",filterMembers);
  document.getElementById("mFilt").addEventListener("change",filterMembers);
  document.getElementById("newsFrow").addEventListener("click",function(ev){var t=ev.target.closest(".ftab");if(!t)return;document.querySelectorAll("#newsFrow .ftab").forEach(function(x){x.classList.remove("on");});t.classList.add("on");var cat=t.dataset.cat;renderNews(cat==="All"?allN:allN.filter(function(n){return n.category===cat;}));});
  document.getElementById("wellFrow").addEventListener("click",function(ev){var t=ev.target.closest(".ftab");if(!t)return;document.querySelectorAll("#wellFrow .ftab").forEach(function(x){x.classList.remove("on");});t.classList.add("on");loadWell(t.dataset.w);});
  document.getElementById("chatRooms").addEventListener("click",function(ev){var t=ev.target.closest(".ftab");if(!t)return;document.querySelectorAll("#chatRooms .ftab").forEach(function(x){x.classList.remove("on");});t.classList.add("on");chatRoom=t.dataset.room;loadChat();});
  document.getElementById("chatSnd").onclick=sendChat;
  document.getElementById("chatInp").addEventListener("keydown",function(ev){if(ev.key==="Enter")sendChat();});
  var osv=window.sv;
  window.sv=function(nm2){if(cTick){clearInterval(cTick);cTick=null;}osv(nm2);if(nm2==="chat"){loadChat();cTick=setInterval(loadChat,8000);}};
  loadFeed();if(typeof renderStoriesBar==="function")setTimeout(renderStoriesBar,500);loadCelebs();loadNews();loadComs();loadEvents();loadRadio();loadTV();loadMag();loadWell("fitness");loadMembers();loadRanks();loadPolls();loadProfile();loadMsgs();loadNotifs();loadVIP();
}
function attachBack(ov){var btn=document.getElementById("ovBack");if(btn)btn.onclick=function(){ov.remove();};}

// FEED
// ── STORIES / MOMENTS ──
window.renderStoriesBar=function renderStoriesBar(){
  var sb=document.getElementById("storiesBar");if(!sb)return;
  // Load stories from Firestore — if empty show placeholder
  sg(query(collection(db,"stories"),limit(20))).then(function(snap){
    var stories=[];snap.forEach(function(d){stories.push({id:d.id,...d.data()});});
    // Filter out expired (>24hrs)
    var now=Date.now();
    stories=stories.filter(function(s){return s.createdAt&&(now-(s.createdAt.seconds*1000))<86400000;});
    var h="";
    // Add story button — your own
    h+="<div onclick='if(window.openAddStory)window.openAddStory();' style='display:flex;flex-direction:column;align-items:center;gap:5px;flex-shrink:0;cursor:pointer;'>"
      +"<div style='width:58px;height:58px;border-radius:50%;background:var(--bg3);border:2.5px dashed var(--accent);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--accent);'>+</div>"
      +"<div style='font-family:Sora,sans-serif;font-size:0.62rem;font-weight:600;color:var(--text3);white-space:nowrap;'>Your Story</div></div>";
    stories.slice(0,15).forEach(function(s){
      var av=s.userPhoto&&s.userPhoto.startsWith("http")
        ?"<img src='"+xu(s.userPhoto)+"' style='width:100%;height:100%;object-fit:cover;border-radius:50%;' onerror='this.remove()'/>"
        :"<span style='font-size:1.2rem;'>"+xe((s.userName||"?").charAt(0))+"</span>";
      h+="<div data-story-id='"+s.id+"' onclick='openStory(\""+s.id+"\")' style='display:flex;flex-direction:column;align-items:center;gap:5px;flex-shrink:0;cursor:pointer;'>"
        +"<div style='width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#5AC8FA);padding:2.5px;'>"
        +"<div style='width:100%;height:100%;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;overflow:hidden;'>"+av+"</div></div>"
        +"<div style='font-family:Sora,sans-serif;font-size:0.62rem;font-weight:600;color:var(--text2);white-space:nowrap;max-width:62px;overflow:hidden;text-overflow:ellipsis;'>"+xe((s.userName||"Member").split(" ")[0])+"</div></div>";
    });
    sb.innerHTML=h;
  }).catch(function(){});
}

window.openAddStory=function openAddStory(){
  if(!cU){toast("Sign in to add a story","error");return;}
  var ov=mkOv();
  var h=navRow("Add Your Story");
  h+="<div style='padding:16px;'>";
  h+="<div style='font-family:Sora,sans-serif;font-size:0.8rem;color:var(--text2);margin-bottom:14px;line-height:1.6;'>Stories disappear after 24 hours. Share your moments, thoughts, music, anything!</div>";
  h+="<div class='fg'><label class='fl'>What's your moment?</label>"
    +"<textarea class='fi' id='stTxt' rows='3' placeholder='Share a thought, vibe or moment...'></textarea></div>";
  h+="<div class='fg'><label class='fl'>Add Photo / Video</label>"
    +"<div class='upbox' id='stUp' onclick='document.getElementById(\"stFile\").click()'>"
    +"<div style='font-size:1.6rem;margin-bottom:4px;'>📸</div>"
    +"<div id='stFnm' style='font-family:Sora,sans-serif;font-size:0.72rem;color:var(--text3);'>Tap to choose photo or video</div>"
    +"<input type='file' id='stFile' accept='image/*,video/*' style='display:none;'/></div></div>";
  h+="<div id='stPrev' style='display:none;margin-bottom:12px;'>"
    +"<img id='stPrevImg' style='width:100%;max-height:220px;object-fit:cover;border-radius:12px;display:none;'/>"
    +"<video id='stPrevVid' controls style='width:100%;max-height:220px;border-radius:12px;display:none;'></video></div>";
  var colorBtns=["#0A84FF","#FF3CAC","#FF6B9D","#34C759","#FF9F0A","#BF5AF2","#1C1C1E"].map(function(c){
    return "<div onclick='document.getElementById(\"stBg\").value=\""+c+"\"'"
      +" style='width:32px;height:44px;border-radius:50%;background:"+c+";cursor:pointer;border:2.5px solid transparent;transition:border 0.2s;'"
      +" onmouseover='this.style.borderColor=\"#fff\"'"
      +" onmouseout='this.style.borderColor=\"transparent\"'></div>";
  }).join("");
  h+="<div class='fg'><label class='fl'>Background Color (for text-only stories)</label>"
    +"<div style='display:flex;gap:8px;flex-wrap:wrap;'>"+colorBtns+"</div>"
    +"<input type='hidden' id='stBg' value='#0A84FF'/></div>";
  h+="<button class='btn-g' id='stPost'>Post Story ✨</button></div>";
  ov.innerHTML=h;attachBack(ov);
  // File preview
  document.getElementById("stFile").onchange=function(){
    var file=this.files[0];if(!file)return;
    document.getElementById("stFnm").textContent=file.name;
    document.getElementById("stPrev").style.display="block";
    var reader=new FileReader();
    reader.onload=function(e){
      if(file.type.startsWith("video")){
        document.getElementById("stPrevVid").src=e.target.result;
        document.getElementById("stPrevVid").style.display="block";
        document.getElementById("stPrevImg").style.display="none";
      }else{
        document.getElementById("stPrevImg").src=e.target.result;
        document.getElementById("stPrevImg").style.display="block";
        document.getElementById("stPrevVid").style.display="none";
      }
    };reader.readAsDataURL(file);
  };
  // Post story
  document.getElementById("stPost").onclick=async function(){
    var txt=document.getElementById("stTxt").value.trim();
    var file=document.getElementById("stFile").files[0];
    var bg=document.getElementById("stBg").value||"#0A84FF";
    if(!txt&&!file){toast("Add text or a photo to your story","error");return;}
    this.disabled=true;this.textContent="Posting...";
    try{
      var mediaUrl="",mediaType="";
      if(file){
        // Check file size — max 10MB
        if(file.size>50*1024*1024){
          toast("File too large. Max 50MB please.","error");
          this.disabled=false;this.textContent="Post Story ✨";
          return;
        }
        this.textContent="Uploading media...";
        try{
          mediaUrl=await upload(file);
          mediaType=file.type.startsWith("video")?"video":"image";
        }catch(ue){
          toast("Upload failed: "+ue.message,"error");
          this.disabled=false;this.textContent="Post Story ✨";
          return;
        }
      }
      this.textContent="Saving...";
      await addDoc(collection(db,"stories"),{
        text:txt,
        mediaUrl:mediaUrl,
        videoUrl:mediaType==="video"?mediaUrl:"",
        imageUrl:mediaType==="image"?mediaUrl:"",
        mediaType:mediaType,
        bg:bg,
        userId:cU.uid,
        userName:(cD&&cD.name)||"Member",
        userPhoto:(cD&&cD.profilePic)||"",
        createdAt:serverTimestamp()
      });
      toast("Story posted! ✨ Visible for 24 hours");
      ov.remove();
      setTimeout(renderStoriesBar,1000);
    }catch(e){
      console.error("Story error:",e);
      toast("Error: "+(e.message||"Try again"),"error");
    }
    this.disabled=false;this.textContent="Post Story ✨";
  };
}

window.openStory=function openStory(storyId){
  sg(query(collection(db,"stories"),limit(20))).then(function(snap){
    var stories=[];snap.forEach(function(d){stories.push({id:d.id,...d.data()});});
    var s=stories.find(function(x){return x.id===storyId;});
    if(!s)return;
    document.querySelectorAll("[data-story-ov]").forEach(function(x){x.remove();});

    var isVideo=s.mediaType==="video"||(s.mediaUrl&&(s.mediaUrl.includes(".mp4")||s.mediaUrl.includes(".mov")||s.mediaUrl.includes(".webm")));
    var hasMedia=!!(s.mediaUrl&&s.mediaUrl.startsWith("http"));
    var duration=isVideo?30000:hasMedia?12000:8000;
    var durationSec=duration/1000;

    var ov=document.createElement("div");
    ov.setAttribute("data-story-ov","1");
    ov.style.cssText="position:fixed;inset:0;background:"+(hasMedia?"#000":(s.bg||"#0A84FF"))+";z-index:9500;overflow:hidden;";
    document.body.appendChild(ov);

    var uPic=s.userPhoto&&s.userPhoto.startsWith("http")
      ?"<img src='"+xu(s.userPhoto)+"' style='width:100%;height:100%;object-fit:cover;border-radius:50%;'/>"
      :"<span style='color:#fff;font-weight:700;'>"+xe((s.userName||"?").charAt(0))+"</span>";

    var mediaHtml="";
    if(hasMedia){
      if(isVideo){
        mediaHtml="<video id='stVid' src='"+xu(s.mediaUrl)+"' autoplay playsinline muted style='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;'></video>";
      }else{
        mediaHtml="<img src='"+xu(s.mediaUrl)+"' style='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;'/>";
      }
    }

    var textHtml="";
    if(s.text&&hasMedia){
      textHtml="<div style='position:absolute;bottom:0;left:0;right:0;padding:20px 16px 40px;background:linear-gradient(transparent,rgba(0,0,0,0.8));z-index:3;'>"
        +"<div style='font-family:Sora,sans-serif;font-weight:700;font-size:1.1rem;color:#fff;line-height:1.55;word-break:break-word;'>"+xe(s.text)+"</div>"
        +"</div>";
    }else if(s.text){
      textHtml="<div style='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:30px 24px;z-index:3;'>"
        +"<div style='font-family:Sora,sans-serif;font-weight:800;font-size:1.4rem;color:#fff;line-height:1.6;text-align:center;word-break:break-word;'>"+xe(s.text)+"</div>"
        +"</div>";
    }

    ov.innerHTML=""
      +"<div style='position:absolute;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.3);z-index:10;'>"
        +"<div id='stProg' style='height:100%;background:#fff;width:0%;transition:width "+durationSec+"s linear;'></div>"
      +"</div>"
      +"<div style='position:absolute;top:4px;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;z-index:10;background:linear-gradient(rgba(0,0,0,0.5),transparent);'>"
        +"<div style='display:flex;align-items:center;gap:8px;'>"
          +"<div style='width:36px;height:36px;border-radius:50%;border:2px solid rgba(255,255,255,0.9);overflow:hidden;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.2);flex-shrink:0;'>"+uPic+"</div>"
          +"<div style='font-family:Sora,sans-serif;font-weight:700;font-size:0.8rem;color:#fff;'>"+xe(s.userName||"Member")+"</div>"
        +"</div>"
        +"<button id='stClose' style='background:rgba(0,0,0,0.5);border:none;color:#fff;font-size:1.1rem;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;'>✕</button>"
      +"</div>"
      +mediaHtml
      +textHtml;

    document.getElementById("stClose").onclick=function(e){e.stopPropagation();ov.remove();};
    ov.onclick=function(e){if(e.target===ov)ov.remove();};

    var autoClose=setTimeout(function(){ov.remove();},duration);
    setTimeout(function(){var p=document.getElementById("stProg");if(p)p.style.width="100%";},300);

    if(isVideo){
      clearTimeout(autoClose);
      setTimeout(function(){
        var vid=document.getElementById("stVid");
        if(vid){vid.onended=function(){ov.remove();};vid.muted=false;try{vid.play();}catch(e){}}
      },400);
    }
  }).catch(function(e){console.error("Story load error:",e);});
}

async function loadFeed(){
  var el=document.getElementById("feedList");
  var snap=await sg(query(collection(db,"posts"),limit(30)));
  var posts=[];snap.forEach(function(d){posts.push({id:d.id,...d.data()});});
  posts.sort(function(a,b){return(b.createdAt&&b.createdAt.seconds||0)-(a.createdAt&&a.createdAt.seconds||0);});
  if(!posts.length){el.innerHTML="<div class=\"card\" style=\"text-align:center;padding:28px 20px;border:1.5px dashed var(--border2);\"><div style=\"font-size:2rem;margin-bottom:10px;\">✨</div><div style=\"font-family:'Sora',sans-serif;font-weight:700;font-size:0.95rem;color:var(--text);margin-bottom:6px;\">No posts yet</div><div style=\"font-family:'Sora',sans-serif;font-size:0.8rem;color:var(--text3);\">Be the first to share with the community!</div></div>";return;}
  var h="";
  posts.forEach(function(p){
    var nm=xe("ICONIK");
    var dt=p.createdAt&&p.createdAt.toDate?p.createdAt.toDate().toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"}):"";
    var isOwn=(typeof cU!=="undefined"&&cU&&p.userId===cU.uid);
    var lc=p.likeCount||0; var cc=p.commentCount||0;
    var avContent=nm.charAt(0);
    if(p.userPhoto&&p.userPhoto.startsWith("http"))avContent="<img src=\""+xu(p.userPhoto)+"\" style=\"position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%;\" onerror=\"this.remove()\"/>";
    h+="<div class=\"card\" style=\"padding:14px;margin-bottom:10px;\">";
    // Header
    h+="<div style=\"display:flex;align-items:center;gap:10px;margin-bottom:10px;\">";
    h+="<div class=\"mav\" style=\"width:40px;height:40px;font-size:0.9rem;position:relative;\">"+avContent+nm.charAt(0)+"</div>";
    h+="<div style=\"flex:1;min-width:0;\">";
    h+="<div style=\"font-family:'Sora',sans-serif;font-weight:700;font-size:0.9rem;color:var(--text);letter-spacing:-0.01em;\">"+nm+(p.isAdmin?" <span style=\"font-size:0.6rem;background:var(--accent);color:#fff;padding:2px 7px;border-radius:12px;font-weight:600;\">ICONIK</span>":"")+"</div>";
    h+="<div style=\"font-family:'Sora',sans-serif;font-weight:600;font-size:0.72rem;color:var(--accent);margin-top:1px;\">"+xe(p.category?p.category.toUpperCase():"ICONIK")+(dt?" · <span style='color:var(--text3);font-weight:500;'>"+dt+"</span>":"")+"</div></div></div>";
    // Title
    if(p.title)h+="<div style=\"font-family:'Sora',sans-serif;font-weight:800;font-size:1.0rem;color:var(--text);margin-bottom:8px;line-height:1.35;letter-spacing:-0.02em;\">"+xe(p.title)+"</div>";
    // Content
    h+="<div style=\"font-family:'Sora',sans-serif;font-size:0.88rem;font-weight:400;color:var(--text);line-height:1.7;margin-bottom:10px;\">"+xe(p.content||"")+"</div>";
    // Media
    if(p.imageUrl&&p.imageUrl.startsWith("http"))h+="<img src=\""+xu(p.imageUrl)+"\" style=\"width:100%;border-radius:var(--radius);margin-bottom:10px;max-height:300px;object-fit:cover;\" loading=\"lazy\" onerror=\"this.remove()\"/>";
    if(p.videoUrl&&p.videoUrl.startsWith("http"))h+="<video src=\""+xu(p.videoUrl)+"\" controls style=\"width:100%;border-radius:var(--radius);margin-bottom:10px;\" onerror=\"this.remove()\"></video>";
    // Actions
    var abtn="background:none;border:none;display:flex;align-items:center;gap:5px;cursor:pointer;padding:5px 3px;font-family:'Sora',sans-serif;font-size:0.75rem;font-weight:600;color:var(--text2);transition:color 0.15s;";
    h+="<div style=\"display:flex;align-items:center;gap:12px;padding-top:10px;border-top:1px solid var(--border);\">";
    h+="<button data-pid=\""+p.id+"\" style=\""+abtn+"\"><span class=\"heart-icon\" style=\"font-size:1.05rem;\">♡</span><span class=\"heart-count\">"+lc+"</span></button>";
    h+="<button data-cmt=\""+p.id+"\" style=\""+abtn+"\">💬 <span id=\"cc-"+p.id+"\">"+cc+"</span></button>";
    h+="<button data-sh=\""+p.id+"\" data-sh-nm=\""+xu(nm)+"\" data-sh-body=\""+xu((p.content||"").substring(0,80))+"\" style=\""+abtn+"\">🔗 Share</button>";
    h+="<button data-rp=\""+p.id+"\" data-rp-ct=\""+xu((p.content||"").substring(0,200))+"\" data-rp-au=\""+xu(nm)+"\" data-rp-img=\""+xu(p.imageUrl||"")+"\" style=\""+abtn+"\">🔁</button>";
    if(isOwn){
      h+="<div style=\"margin-left:auto;display:flex;gap:5px;\">";
      h+="<button data-ep=\""+p.id+"\" data-ep-ct=\""+xu(p.content||"")+"\" data-ep-ti=\""+xu(p.title||"")+"\" style=\"background:var(--accent-soft);border:1px solid var(--accent-glow);border-radius:6px;padding:4px 10px;cursor:pointer;font-family:'Sora',sans-serif;font-size:0.7rem;font-weight:700;color:var(--accent);\">✏️</button>";
      h+="<button data-dp=\""+p.id+"\" style=\"background:rgba(255,59,48,0.08);border:1px solid rgba(255,59,48,0.25);border-radius:6px;padding:4px 10px;cursor:pointer;font-family:'Sora',sans-serif;font-size:0.7rem;font-weight:700;color:var(--err);\">🗑</button>";
      h+="</div>";
    }
    h+="</div>";
    // Comment thread placeholder
    h+="<div id=\"thread-"+p.id+"\" style=\"display:none;\"></div>";
    h+="</div>";
  });
  el.innerHTML=h;
  el.onclick=null;
  el.addEventListener("click",async function(ev){
    // Like
    var lk=ev.target.closest("[data-pid]");
    if(lk&&!lk.dataset.ep&&!lk.dataset.dp){
      var hi=lk.querySelector(".heart-icon");var hc=lk.querySelector(".heart-count");
      var n=parseInt((hc&&hc.textContent)||"0")||0;
      if(hi){hi.textContent="♥";hi.style.color="var(--err)";}
      if(hc)hc.textContent=n+1;
      if(cU)try{await setDoc(doc(db,"likes",cU.uid+"_"+lk.dataset.pid),{userId:cU.uid,postId:lk.dataset.pid,createdAt:serverTimestamp()});}catch{}
      return;
    }
    // Comment
    var cm=ev.target.closest("[data-cmt]");
    if(cm){openCommentBox(cm.dataset.cmt,cm.dataset.cmtNm||"Post");return;}
    // Share
    var sh=ev.target.closest("[data-sh]");
    if(sh){doShare((sh.dataset.shNm||"ICONIK")+" on ICONIK",(sh.dataset.shBody||"")+" 🌟","https://iconik-global.web.app");return;}
    // Repost
    var rp=ev.target.closest("[data-rp]");
    if(rp){if(!cU){toast("Sign in to repost","error");return;}openRepostModal(rp.dataset.rp,rp.dataset.rpCt||"",rp.dataset.rpAu||"ICONIK",rp.dataset.rpImg||"");return;}
    // Edit own post
    var ep=ev.target.closest("[data-ep]");
    if(ep){openEditPost(ep.dataset.ep,ep.dataset.epTi||"",ep.dataset.epCt||"");return;}
    // Delete own post
    var dp=ev.target.closest("[data-dp]");
    if(dp){if(!confirm("Delete this post? Cannot be undone."))return;
      try{await deleteDoc(doc(db,"posts",dp.dataset.dp));toast("Post deleted 🗑");loadFeed();}catch{toast("Error deleting","error");}
      return;}
  });
}

function openEditPost(pid,oldTitle,oldContent){
  var ov=mkOv();
  var h=navRow("Edit Post");
  h+="<div style='padding:16px;'>";
  h+="<div class='fg'><label class='fl'>Title (optional)</label>"
    +"<input class='fi' id='epTitle' value='"+xu(oldTitle)+"' placeholder='Post title...'/></div>";
  h+="<div class='fg'><label class='fl'>Content *</label>"
    +"<textarea class='fi' id='epContent' rows='5' style='resize:vertical;'>"+xu(oldContent)+"</textarea></div>";
  // Media section
  h+="<div class='fg'>"
    +"<label class='fl'>Replace Photo (optional)</label>"
    +"<div class='upbox' id='epUpBox'>"
    +"<div style='font-size:1.4rem;margin-bottom:4px;'>📷</div>"
    +"<div id='epFnm' style='font-family:Sora,sans-serif;font-size:0.72rem;color:var(--text3);'>Tap to choose new photo or video</div>"
    +"<input type='file' id='epFile' accept='image/*,video/*' style='display:none;'/>"
    +"</div>"
    +"<input class='fi' id='epMediaUrl' placeholder='Or paste photo/video URL directly...' style='margin-top:8px;'/>"
    +"</div>";
  h+="<div class='fg'>"
    +"<label class='fl'>Remove existing media?</label>"
    +"<div style='display:flex;align-items:center;gap:8px;'>"
    +"<input type='checkbox' id='epRemoveMedia' style='width:18px;height:18px;cursor:pointer;accent-color:var(--err);'/>"
    +"<span style='font-family:Sora,sans-serif;font-size:0.8rem;color:var(--text2);'>Yes, remove current photo/video</span>"
    +"</div></div>";
  h+="<button class='btn-g' id='epSave'>Save Changes ✅</button>";
  h+="</div>";
  ov.innerHTML=h;attachBack(ov);
  document.getElementById("epUpBox").onclick=function(){document.getElementById("epFile").click();};
  document.getElementById("epFile").onchange=function(){
    if(this.files[0])document.getElementById("epFnm").textContent="Selected: "+this.files[0].name;
  };
  document.getElementById("epSave").onclick=async function(){
    var nc=document.getElementById("epContent").value.trim();
    var nt=document.getElementById("epTitle").value.trim();
    if(!nc){toast("Content cannot be empty","error");return;}
    this.disabled=true;this.textContent="Saving...";
    try{
      var updates={title:nt,content:nc};
      // Handle media
      var removeMedia=document.getElementById("epRemoveMedia").checked;
      if(removeMedia){updates.imageUrl="";updates.videoUrl="";}
      else{
        var urlInput=document.getElementById("epMediaUrl").value.trim();
        var file=document.getElementById("epFile").files[0];
        if(file){
          try{var up=await upload(file);updates.imageUrl=up;}catch(e){toast("Upload failed — using URL if provided","error");}
        }else if(urlInput&&urlInput.startsWith("http")){
          updates.imageUrl=urlInput;
        }
      }
      await updateDoc(doc(db,"posts",pid),updates);
      toast("Post updated! ✅");ov.remove();loadFeed();
    }catch(e){toast("Error saving — try again","error");console.error(e);}
    this.disabled=false;this.textContent="Save Changes ✅";
  };
}

// COMPOSER
function openComposer(){
  var ov=mkOv();
  var h=navRow("Share with Community");
  h+="<div style=\"padding:16px;\">";
  h+="<div class=\"fg\"><label class=\"fl\">What's on your mind? *</label><textarea class=\"fi\" id=\"pcTxt\" rows=\"5\" placeholder=\"Share your thoughts...\"></textarea></div>";
  h+="<div class=\"fg\"><label class=\"fl\">Photo URL (optional)</label><input class=\"fi\" id=\"pcPh\" placeholder=\"https://...\"/></div>";
  h+="<div class=\"fg\"><label class=\"fl\">Video URL (optional)</label><input class=\"fi\" id=\"pcVid\" placeholder=\"https://youtube.com/...\"/></div>";
  h+="<div class=\"fg\"><label class=\"fl\">Upload File</label><div class=\"upbox\" id=\"pcUpBox\"><div style=\"font-size:1.4rem;margin-bottom:4px;\">&#128206;</div><div id=\"pcFnm\" style=\"font-size:0.64rem;color:var(--muted);\">Tap to choose photo or video</div><input type=\"file\" id=\"pcF\" accept=\"image/*,video/*\" style=\"display:none;\"/></div></div>";
  h+="<div class=\"fg\"><label class=\"fl\">Community</label><select class=\"fi\" id=\"pcCat\"><option value=\"\">All Communities</option><option>Music</option><option>Sports</option><option>Film &amp; TV</option><option>Fashion</option><option>Fitness &amp; Wellness</option><option>Tech &amp; Innovation</option></select></div>";
  h+="<div id=\"pcErr\" style=\"display:none;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#FCA5A5;font-size:0.7rem;padding:10px;border-radius:6px;margin-bottom:10px;\"></div>";
  h+="<button class=\"btn-g\" id=\"pcSbm\">Share Post &#8594;</button></div>";
  ov.innerHTML=h;
  attachBack(ov);
  document.getElementById("pcUpBox").onclick=function(){document.getElementById("pcF").click();};
  document.getElementById("pcF").onchange=function(){document.getElementById("pcFnm").textContent=this.files[0]?this.files[0].name:"File selected";};
  document.getElementById("pcSbm").onclick=async function(){
    var txt=document.getElementById("pcTxt").value.trim();
    if(!txt){var er=document.getElementById("pcErr");er.textContent="Please write something.";er.style.display="block";return;}
    this.disabled=true;this.textContent="Sharing...";
    try{
      var imgUrl=document.getElementById("pcPh").value.trim();
      var vidUrl=document.getElementById("pcVid").value.trim();
      var f=document.getElementById("pcF").files[0];
      if(f&&!imgUrl&&!vidUrl){try{var url=await upload(f);if(f.type.startsWith("video"))vidUrl=url;else imgUrl=url;}catch(ue){console.error("Upload error:",ue);var er=document.getElementById("pcErr");er.textContent="Image upload failed: "+(ue.message||"Check Cloudinary settings");er.style.display="block";this.disabled=false;this.textContent="Share Post &#8594;";return;}}
      await addDoc(collection(db,"posts"),{content:txt,title:"",category:document.getElementById("pcCat").value||(cD&&cD.categories&&cD.categories[0])||"",userId:cU.uid,userName:(cD&&cD.name)||"Member",userPhoto:(cD&&cD.profilePic)||"",imageUrl:imgUrl||"",videoUrl:vidUrl||"",isAdmin:false,likeCount:0,commentCount:0,createdAt:serverTimestamp()});
      ov.remove();toast("Post shared!");loadFeed();
    }catch(e){var er=document.getElementById("pcErr");er.textContent="Error: "+(e.message||"Try again. Check your connection.");er.style.display="block";this.disabled=false;this.textContent="Share Post &#8594;";console.error("Post error:",e);}
  };
}

// CELEBRITIES
