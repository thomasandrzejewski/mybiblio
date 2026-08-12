// auth.js — small auth UI using Supabase (magic link email)
// Include this script as a module on pages that have an #authArea element

const AUTH_AREA_ID = 'authArea';
const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

async function initAuth(){
  const el = document.getElementById(AUTH_AREA_ID);
  if(!el) return;
  if(!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY){
    // no supabase configured — render nothing
    el.innerHTML = '';
    return;
  }
  const { createClient } = await import(CDN);
  const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  function renderSignedOut(){
    el.innerHTML = `<form id="signinForm" class="auth-form">`+
      `<input id="authEmail" type="email" placeholder="Votre email" required>`+
      `<button id="authSignIn" type="submit" class="secondary">Se connecter</button>`+
      `</form>`;
    const form = document.getElementById('signinForm');
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      if(!email) return alert('Entrez un email');
      try{
        await supabase.auth.signIn({ email });
        alert('Email envoyé. Vérifiez votre boîte mail pour le lien de connexion.');
      }catch(err){
        alert(err.message || 'Erreur lors de la demande de connexion');
      }
    });
  }

  function renderSignedIn(user){
    el.innerHTML = `<div class="auth-info">Connecté: <strong>${user.email}</strong> <button id="signOutBtn" class="secondary">Se déconnecter</button></div>`;
    document.getElementById('signOutBtn').addEventListener('click', async ()=>{
      await supabase.auth.signOut();
    });
  }

  const session = await supabase.auth.session();
  if(session && session.user){
    renderSignedIn(session.user);
  }else{
    renderSignedOut();
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if(session && session.user) renderSignedIn(session.user);
    else renderSignedOut();
  });
}

initAuth().catch(err=>{ console.error('auth init failed', err); });
