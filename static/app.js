const API = "";

let currentUserId = null;
let currentUsername = null;
let peerUserId = null;
let pollTimer = null;
let msgSearch = "";
let typingTimer = null;
let usersCache = [];

const $ = (id) => document.getElementById(id);

function api(path, options = {}) {
  return fetch(API + path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") document.body.classList.add("theme-dark");
  $("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("theme-dark");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("theme-dark") ? "dark" : "light",
    );
  });
}

function saveSession(user) {
  localStorage.setItem("currentUserId", String(user.id));
  localStorage.setItem("currentUsername", user.username);
  currentUserId = user.id;
  currentUsername = user.username;
}

function clearSession() {
  localStorage.removeItem("currentUserId");
  localStorage.removeItem("currentUsername");
  currentUserId = null;
  currentUsername = null;
  peerUserId = null;
}

function restoreSession() {
  const id = Number(localStorage.getItem("currentUserId") || "0");
  const username = localStorage.getItem("currentUsername");
  if (id > 0 && username) {
    currentUserId = id;
    currentUsername = username;
  }
}

function setScreens() {
  const loggedIn = Boolean(currentUserId);
  $("authScreen").hidden = loggedIn;
  $("chatScreen").hidden = !loggedIn;
  $("logoutBtn").hidden = !loggedIn;
}

async function loadUsers() {
  const q = $("userSearch").value.trim();
  const url = q ? `/api/users?q=${encodeURIComponent(q)}` : "/api/users";
  const res = await api(url);
  if (!res.ok) throw new Error("Failed to load users");
  const users = await res.json();
  usersCache = users;
  return users;
}

function renderUsers(users) {
  const ul = $("userList");
  ul.innerHTML = "";
  users.forEach((u) => {
    const li = document.createElement("li");
    li.textContent = `${u.username} (#${u.id})`;
    li.dataset.id = String(u.id);
    if (u.id === currentUserId) li.classList.add("active-me");
    if (u.id === peerUserId) li.classList.add("selected-peer");
    li.addEventListener("click", () => {
      if (u.id === currentUserId) {
        $("chatPeerLabel").textContent = "Pick another user (not yourself).";
        return;
      }
      peerUserId = u.id;
      $("chatPeerLabel").textContent = `Chat with ${u.username} (#${u.id})`;
      startPoll();
      refreshChat().catch(console.error);
      updateComposerState();
      loadUsers().then(renderUsers).catch(console.error);
    });
    ul.appendChild(li);
  });
}

async function login(ev) {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const identifier = String(fd.get("identifier") || "").trim();
  if (!identifier) return;
  $("loginStatus").textContent = "Logging in…";

  const res = await api(`/api/users?q=${encodeURIComponent(identifier)}`);
  const users = await res.json().catch(() => []);
  if (!res.ok) {
    $("loginStatus").textContent = "Login failed";
    return;
  }
  const termLower = identifier.toLowerCase();
  const exact = (users || []).find(
    (u) => String(u.username).toLowerCase() === termLower || String(u.email).toLowerCase() === termLower,
  );
  const user = exact || (users || [])[0];
  if (!user) {
    $("loginStatus").textContent = "User not found";
    return;
  }

  saveSession(user);
  setScreens();
  $("loginStatus").textContent = "";
  ev.target.reset();
  await loadUsers().then(renderUsers);
}

async function register(ev) {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const body = {
    username: fd.get("username"),
    email: fd.get("email"),
    password: fd.get("password"),
  };
  $("registerStatus").textContent = "Creating…";
  const res = await api("/api/users", { method: "POST", body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    $("registerStatus").textContent = data.detail || "Registration failed";
    return;
  }
  saveSession(data);
  $("registerStatus").textContent = "";
  setScreens();
  ev.target.reset();
  await loadUsers().then(renderUsers);
}

function conversationUrl() {
  if (!currentUserId || !peerUserId) return null;
  const a = Math.min(currentUserId, peerUserId);
  const b = Math.max(currentUserId, peerUserId);
  const params = new URLSearchParams();
  if (msgSearch) params.set("search", msgSearch);
  const qs = params.toString();
  return `/api/messages/conversation/${a}/${b}${qs ? `?${qs}` : ""}`;
}

async function refreshChat() {
  const url = conversationUrl();
  if (!url) return;
  const res = await api(url);
  if (!res.ok) return;
  const messages = await res.json();
  renderChat(messages);
}

function renderChat(messages) {
  const win = $("chatWindow");
  win.innerHTML = "";
  if (!currentUserId || !peerUserId) return;
  messages.forEach((m) => {
    const wrap = document.createElement("div");
    wrap.className = "msg " + (m.sender_id === currentUserId ? "me" : "them");
    const meta = document.createElement("div");
    meta.className = "msg-meta";
    const name =
      m.sender_id === currentUserId
        ? currentUsername || "You"
        : m.sender_username || `User #${m.sender_id}`;
    const ts = formatTimestamp(m.created_at);
    meta.textContent = `${name} • ${ts}`;
    const text = document.createElement("div");
    text.textContent = m.content;
    wrap.appendChild(meta);
    wrap.appendChild(text);
    win.appendChild(wrap);
  });
  win.scrollTop = win.scrollHeight;
}

function formatTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stopPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

function startPoll() {
  stopPoll();
  pollTimer = setInterval(() => {
    refreshChat().catch(console.error);
  }, 2500);
}

function updateComposerState() {
  const ok = Boolean(currentUserId && peerUserId && peerUserId !== currentUserId);
  $("messageInput").disabled = !ok;
  $("sendBtn").disabled = !ok;
}

async function sendMessage(ev) {
  ev.preventDefault();
  const content = $("messageInput").value.trim();
  if (!content || !currentUserId || !peerUserId) return;
  const res = await api("/api/messages", {
    method: "POST",
    body: JSON.stringify({
      sender_id: currentUserId,
      receiver_id: peerUserId,
      content,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err.detail || "Failed to send");
    return;
  }
  $("messageInput").value = "";
  await refreshChat();
}

function onTyping() {
  const hint = $("typingHint");
  hint.hidden = false;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    hint.hidden = true;
  }, 900);
}

function wireEvents() {
  $("loginForm").addEventListener("submit", (e) => login(e).catch(console.error));
  $("registerForm").addEventListener("submit", (e) => register(e).catch(console.error));
  $("refreshUsers").addEventListener("click", () =>
    loadUsers().then(renderUsers).catch(console.error),
  );
  $("userSearch").addEventListener(
    "input",
    debounce(() => loadUsers().then(renderUsers).catch(console.error), 300),
  );
  $("sendForm").addEventListener("submit", (e) => sendMessage(e).catch(console.error));
  $("messageInput").addEventListener("input", onTyping);
  $("applyMsgSearch").addEventListener("click", () => {
    msgSearch = $("messageSearch").value.trim();
    refreshChat().catch(console.error);
  });
  $("clearMsgSearch").addEventListener("click", () => {
    $("messageSearch").value = "";
    msgSearch = "";
    refreshChat().catch(console.error);
  });

  $("logoutBtn").addEventListener("click", () => {
    stopPoll();
    clearSession();
    setScreens();
    renderChat([]);
    $("chatPeerLabel").textContent = "Pick a user on the left";
    $("loginStatus").textContent = "";
    $("registerStatus").textContent = "";
  });
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

initTheme();
wireEvents();
restoreSession();
setScreens();

if (currentUserId) {
  loadUsers()
    .then(renderUsers)
    .catch((e) => {
      console.error(e);
    });
} else {
  // show only auth screen
  $("loginStatus").textContent = "";
}
