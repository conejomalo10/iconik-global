// ── ICONIK FIREBASE CONFIG ──
import{initializeApp}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import{getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import{getFirestore,collection,doc,setDoc,getDoc,getDocs,addDoc,updateDoc,deleteDoc,query,limit,where,serverTimestamp,increment}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const cfg={
  apiKey:"AIzaSyCnX9DszicduSwsFwBZ_iTLI47NPeXkteE",
  authDomain:"iconik-global.firebaseapp.com",
  projectId:"iconik-global",
  storageBucket:"iconik-global.firebasestorage.app",
  messagingSenderId:"1040054516979",
  appId:"1:1040054516979:web:33cd5f07ae8fc146a30b86"
};

const app=initializeApp(cfg);
const auth=getAuth(app);
const db=getFirestore(app);

// Safe Firestore fetch — 5s timeout, never hangs
async function safeGet(ref){
  try{
    return await Promise.race([
      getDocs(ref),
      new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),5000))
    ]);
  }catch(e){
    console.warn('Firestore:',e.message);
    return{empty:true,size:0,forEach:()=>{},docs:[]};
  }
}

// Toast notification
function toast(msg,type='success'){
  const t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;
  t.style.background=type==='error'?'#c0392b':type==='info'?'#2980b9':'#1a7a1a';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}

// Cloudinary upload
async function uploadMedia(file){
  const fd=new FormData();
  fd.append('file',file);
  fd.append('upload_preset','iconik_uploads');
  const r=await fetch('https://api.cloudinary.com/v1_1/dhazrf2xr/upload',{method:'POST',body:fd});
  if(!r.ok)throw new Error('Upload failed — ensure iconik_uploads preset is Unsigned');
  const d=await r.json();
  return{url:d.secure_url,type:file.type.startsWith('video')?'video':'image'};
}

export{auth,db,collection,doc,setDoc,getDoc,getDocs,addDoc,updateDoc,deleteDoc,query,limit,where,serverTimestamp,increment,safeGet,toast,uploadMedia,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail};
