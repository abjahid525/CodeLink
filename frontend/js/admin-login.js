async function postJson(url, body){
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json();
}

document.getElementById('admin-login-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  try{
    const r = await postJson('/api/auth/login', { email, password });
    if (r && r.token){
      // ensure role is admin
      if (r.role !== 'admin'){
        alert('Account is not an admin.');
        return;
      }
      // store admin token and redirect
      localStorage.setItem('adminToken', 'Bearer ' + r.token);
      // also keep codelink-user for app compatibility
      localStorage.setItem('codelink-user', JSON.stringify({ id: r.id, name: r.name, email: r.email, role: r.role, token: r.token }));
      window.location.href = '/admin.html';
    } else {
      alert(r.error || 'Login failed');
    }
  }catch(err){
    console.error(err);
    alert('Login failed');
  }
});
