const API = "";

let currentUserId = null;
let peerUserId = null;
let pollTimer = null;
let msgSearch = "";
let typingTimer = null;

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

async function loadUsers() {
  const q = $("userSearch").value.trim();
  const url = q ? `/api/users?q=${encodeURIComponent(q)}` : "/api/users";
  const res = await api(url);
  if (!res.ok) throw new Error("Не удалось загрузить пользователей");
  return res.json();
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
    li.addEventListener("click", (ev) => {
      if (ev.ctrlKey || ev.metaKey) {
        currentUserId = u.id;
        peerUserId = peerUserId === u.id ? null : peerUserId;
        $("chatPeerLabel").textContent = peerUserId
          ? `Вы #${currentUserId}. Чат с #${peerUserId}`
          : `Вы #${currentUserId}. Выберите собеседника обычным кликом.`;
        if (peerUserId) {
          startPoll();
          refreshChat().catch(console.error);
        } else {
          stopPoll();
          renderChat([]);
        }
        updateComposerState();
        loadUsers().then(renderUsers).catch(console.error);
        return;
      }
      if (!currentUserId) {
        $("registerStatus").textContent =
          "Сначала выберите «это я»: Ctrl+клик по своей строке в списке (после регистрации).";
        return;
      }
      if (u.id === currentUserId) {
        $("chatPeerLabel").textContent = "Выберите другого пользователя для переписки (не себя).";
        return;
      }
      peerUserId = u.id;
      $("chatPeerLabel").textContent = `Переписка с ${u.username} (#${u.id})`;
      startPoll();
      refreshChat().catch(console.error);
      updateComposerState();
      loadUsers().then(renderUsers).catch(console.error);
    });
    ul.appendChild(li);
  });
}

async function register(ev) {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const body = {
    username: fd.get("username"),
    email: fd.get("email"),
    password: fd.get("password"),
  };
  $("registerStatus").textContent = "Отправка…";
  const res = await api("/api/users", { method: "POST", body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    $("registerStatus").textContent = data.detail || "Ошибка регистрации";
    return;
  }
  $("registerStatus").textContent = `Создан пользователь #${data.id}. Выберите собеседника в списке. Чтобы сменить «себя», используйте Ctrl+клик по нужному пользователю.`;
  currentUserId = data.id;
  peerUserId = null;
  $("chatPeerLabel").textContent = `Вы #${data.id}. Выберите собеседника в списке.`;
  updateComposerState();
  ev.target.reset();
  loadUsers().then(renderUsers).catch(console.error);
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
    meta.textContent =
      m.sender_id === currentUserId
        ? "Вы"
        : `Пользователь #${m.sender_id}`;
    const text = document.createElement("div");
    text.textContent = m.content;
    wrap.appendChild(meta);
    wrap.appendChild(text);
    win.appendChild(wrap);
  });
  win.scrollTop = win.scrollHeight;
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
    alert(err.detail || "Не удалось отправить");
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
loadUsers()
  .then(renderUsers)
  .catch((e) => {
    console.error(e);
    $("registerStatus").textContent = "Нет связи с API. Запустите сервер: uvicorn app.main:app --reload";
  });
