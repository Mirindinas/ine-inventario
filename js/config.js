// ===== Conexión con Supabase =====
const SUPABASE_URL = 'https://fipceoqhevskkxcqdxuu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zhwSpPt3-4C3o2TIsJ9Lqw_XRLW7Fg-';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Evita que texto escrito por usuarios se interprete como HTML
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Si no hay sesión, regresa al login
async function requireSession() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) { location.href = 'index.html'; return null; }
  return session;
}

// Nombre y rol del usuario actual
async function getPerfil() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from('perfiles').select('nombre, rol').eq('id', user.id).maybeSingle();
  return { ...(data || {}), email: user.email };
}

async function cerrarSesion() {
  await db.auth.signOut();
  location.href = 'index.html';
}

// Supabase entrega máximo 1000 filas por consulta; esto trae todas
async function fetchAll(tabla, columnas = '*', orden = 'id') {
  const tam = 1000; let desde = 0, todo = [];
  while (true) {
    const { data, error } = await db.from(tabla).select(columnas).order(orden).range(desde, desde + tam - 1);
    if (error) throw error;
    todo = todo.concat(data);
    if (data.length < tam) break;
    desde += tam;
  }
  return todo;
}

// Protege la página, muestra el usuario en el menú y devuelve su perfil
async function iniciarPagina() {
  const s = await requireSession(); if (!s) return null;
  const p = (await getPerfil()) || { email: s.user.email };
  const nombre = p.nombre || p.email;
  const nom = document.querySelector('.sb-user strong');
  const rol = document.querySelector('.sb-user span');
  const av  = document.querySelector('.sb-user .avatar');
  if (nom) nom.textContent = nombre;
  if (rol) rol.textContent = 'Rol: ' + (p.rol || 'usuario');
  if (av)  av.textContent = nombre.split(/[\s@.]/).filter(Boolean).map(x => x[0]).join('').slice(0, 2).toUpperCase();
  return p;
}