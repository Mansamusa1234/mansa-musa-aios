(function () {
  "use strict";

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var receptionistId = script.getAttribute("data-id");
  var color = script.getAttribute("data-color") || "#6366f1";
  var apiBase = script.src.replace(/\/receptionist-widget\.js.*$/, "");

  if (!receptionistId) return;

  /* ── Styles ─────────────────────────────────────────────────────────── */
  var css = `
    #mm-widget-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: ${color}; border: none; cursor: pointer;
      box-shadow: 0 4px 24px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    #mm-widget-btn:hover { transform: scale(1.08); box-shadow: 0 6px 32px rgba(0,0,0,0.35); }
    #mm-widget-btn svg { width: 26px; height: 26px; fill: white; transition: opacity 0.2s; }
    #mm-widget-panel {
      position: fixed; bottom: 92px; right: 24px; z-index: 9998;
      width: 340px; max-width: calc(100vw - 32px);
      background: #0f0f1a; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
      display: none; flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
    }
    #mm-widget-panel.open { display: flex; animation: mmSlideIn 0.2s ease; }
    @keyframes mmSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    #mm-header {
      padding: 14px 16px; display: flex; align-items: center; gap: 10px;
      background: ${color};
    }
    #mm-header-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.7); flex-shrink: 0; }
    #mm-header-name { font-weight: 700; font-size: 14px; color: white; flex: 1; }
    #mm-header-powered { font-size: 10px; color: rgba(255,255,255,0.6); }
    #mm-messages {
      flex: 1; overflow-y: auto; padding: 14px 12px;
      display: flex; flex-direction: column; gap: 8px;
      min-height: 220px; max-height: 300px;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .mm-msg { display: flex; }
    .mm-msg.user { justify-content: flex-end; }
    .mm-bubble {
      max-width: 80%; padding: 9px 13px; border-radius: 14px;
      line-height: 1.45; font-size: 13px;
    }
    .mm-msg.bot .mm-bubble { background: rgba(255,255,255,0.08); color: #e5e7eb; border-bottom-left-radius: 4px; }
    .mm-msg.user .mm-bubble { background: ${color}; color: white; border-bottom-right-radius: 4px; }
    .mm-typing { color: rgba(255,255,255,0.4); font-size: 12px; padding: 4px 0; }
    #mm-capture { padding: 10px 12px; border-top: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); }
    #mm-capture input {
      width: 100%; margin-bottom: 6px; padding: 7px 10px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; color: white; font-size: 12px; outline: none; box-sizing: border-box;
    }
    #mm-capture input::placeholder { color: rgba(255,255,255,0.3); }
    #mm-capture-btn {
      width: 100%; padding: 8px; background: ${color}; border: none;
      border-radius: 8px; color: white; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: opacity 0.15s;
    }
    #mm-capture-btn:hover { opacity: 0.9; }
    #mm-form { padding: 10px 12px; display: flex; gap: 8px; border-top: 1px solid rgba(255,255,255,0.07); }
    #mm-input {
      flex: 1; padding: 9px 12px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px; color: white; font-size: 13px; outline: none;
    }
    #mm-input::placeholder { color: rgba(255,255,255,0.3); }
    #mm-send {
      padding: 9px 14px; background: ${color}; border: none;
      border-radius: 10px; color: white; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: opacity 0.15s; white-space: nowrap;
    }
    #mm-send:disabled { opacity: 0.5; cursor: not-allowed; }
  `;

  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── State ───────────────────────────────────────────────────────────── */
  var messages = [];
  var visitorName = "";
  var visitorEmail = "";
  var captureShown = false;
  var isTyping = false;
  var greeting = null;

  /* ── DOM ─────────────────────────────────────────────────────────────── */
  var btn = document.createElement("button");
  btn.id = "mm-widget-btn";
  btn.setAttribute("aria-label", "Open chat");
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
  document.body.appendChild(btn);

  var panel = document.createElement("div");
  panel.id = "mm-widget-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat");
  panel.innerHTML = `
    <div id="mm-header">
      <div id="mm-header-dot"></div>
      <span id="mm-header-name">AI Receptionist</span>
      <span id="mm-header-powered">Powered by MansaMusaAI</span>
    </div>
    <div id="mm-messages"></div>
    <div id="mm-capture" style="display:none">
      <input id="mm-cap-name" placeholder="Your name" autocomplete="name"/>
      <input id="mm-cap-email" placeholder="Your email (optional)" type="email" autocomplete="email" style="margin-top:6px"/>
      <button id="mm-capture-btn">Start chatting →</button>
    </div>
    <div id="mm-form">
      <input id="mm-input" placeholder="Type a message…" autocomplete="off"/>
      <button id="mm-send">Send</button>
    </div>
  `;
  document.body.appendChild(panel);

  var msgsEl   = panel.querySelector("#mm-messages");
  var inputEl  = panel.querySelector("#mm-input");
  var sendBtn  = panel.querySelector("#mm-send");
  var captureEl = panel.querySelector("#mm-capture");
  var capName  = panel.querySelector("#mm-cap-name");
  var capEmail = panel.querySelector("#mm-cap-email");
  var capBtn   = panel.querySelector("#mm-capture-btn");
  var headerName = panel.querySelector("#mm-header-name");

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function addMessage(role, text) {
    var wrap = document.createElement("div");
    wrap.className = "mm-msg " + (role === "user" ? "user" : "bot");
    var bubble = document.createElement("div");
    bubble.className = "mm-bubble";
    bubble.textContent = text;
    wrap.appendChild(bubble);
    msgsEl.appendChild(wrap);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function showTyping() {
    if (isTyping) return;
    isTyping = true;
    var t = document.createElement("div");
    t.className = "mm-typing";
    t.id = "mm-typing";
    t.textContent = "Typing…";
    msgsEl.appendChild(t);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function hideTyping() {
    isTyping = false;
    var t = document.getElementById("mm-typing");
    if (t) t.remove();
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    messages.push({ role: "user", content: text });
    addMessage("user", text);
    inputEl.value = "";
    sendBtn.disabled = true;
    showTyping();

    try {
      var res = await fetch(apiBase + "/api/receptionist/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receptionistId: receptionistId,
          messages: messages.slice(-12),
          visitorName: visitorName || undefined,
          visitorEmail: visitorEmail || undefined,
        }),
      });
      var data = await res.json();
      hideTyping();
      if (data.reply) {
        messages.push({ role: "assistant", content: data.reply });
        addMessage("bot", data.reply);
        if (!captureShown && messages.length >= 4) {
          showCapture();
        }
      }
    } catch (e) {
      hideTyping();
      addMessage("bot", "Sorry, I'm having trouble connecting. Please try again.");
    }
    sendBtn.disabled = false;
    inputEl.focus();
  }

  function showCapture() {
    captureShown = true;
    captureEl.style.display = "block";
  }

  async function loadReceptionist() {
    try {
      var res = await fetch(apiBase + "/api/receptionist/public/" + receptionistId);
      if (res.ok) {
        var data = await res.json();
        if (data.name) headerName.textContent = data.name;
        if (data.greeting) {
          greeting = data.greeting;
          messages.push({ role: "assistant", content: greeting });
          addMessage("bot", greeting);
        }
      }
    } catch (e) {}
    if (!greeting) {
      var g = "Hello! How can I help you today?";
      messages.push({ role: "assistant", content: g });
      addMessage("bot", g);
    }
  }

  /* ── Events ──────────────────────────────────────────────────────────── */
  var isOpen = false;

  btn.addEventListener("click", function () {
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add("open");
      if (messages.length === 0) loadReceptionist();
      setTimeout(function () { inputEl.focus(); }, 100);
    } else {
      panel.classList.remove("open");
    }
  });

  sendBtn.addEventListener("click", function () {
    sendMessage(inputEl.value);
  });

  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputEl.value);
    }
  });

  capBtn.addEventListener("click", function () {
    visitorName  = (capName.value  || "").trim();
    visitorEmail = (capEmail.value || "").trim();
    captureEl.style.display = "none";
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen) {
      isOpen = false;
      panel.classList.remove("open");
    }
  });
})();
