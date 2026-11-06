import { useEffect, useState } from "react";
import styled from "styled-components";

const ENDPOINT = "/.netlify/functions/tracker-sessions";
const KEY = "turning-manor-counter-session-v1";
const LIVE_ORIGIN = "https://turning-manor-tracker.netlify.app";
let memorySession;
function session() {
  if (memorySession) return memorySession;
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY));
    if (
      saved &&
      typeof saved.id === "string" &&
      /^[0-9a-f-]{36}$/i.test(saved.id)
    ) {
      memorySession = {
        id: saved.id,
        qualified: saved.qualified === true,
        sent: saved.sent === true,
      };
    }
  } catch {
    /* Continue in memory if browser storage is blocked. */
  }
  memorySession ??= { id: crypto.randomUUID(), qualified: false, sent: false };
  return memorySession;
}
function persist(value) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* In-memory fallback. */
  }
}
const Frame = styled.div`
  margin: 26px auto 10px;
  width: fit-content;
  max-width: 100%;
  padding: 14px 20px;
  border: 4px ridge #b49360;
  background: #221913;
  box-shadow:
    inset 0 2px 8px #0009,
    0 4px 10px #0005;
  small {
    display: block;
    color: #e0cfb2;
    margin: 8px 0;
  }
`;
const Digits = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 3px;
  span {
    padding: 4px 7px;
    font:
      bold 26px "Courier New",
      monospace;
    color: #e5e8d0;
    background: linear-gradient(#151713 49%, #000 50%, #292b21 52%);
    border: 1px solid #6c7258;
    box-shadow: inset 0 1px #ffffff22;
  }
`;
export default function TrackerCounter() {
  const [total, setTotal] = useState(null);
  const [status, setStatus] = useState("Loading count…");
  useEffect(() => {
    if (window.location.origin !== LIVE_ORIGIN) {
      setStatus("Counter runs on the live site");
      return;
    }
    let active = true;
    let busy = false;
    let timer;
    let attempts = 0;
    async function refresh() {
      if (busy) return;
      busy = true;
      let retry = false;
      try {
        const current = session();
        const post = current.qualified && !current.sent;
        const response = await fetch(ENDPOINT, {
          method: post ? "POST" : "GET",
          cache: "no-store",
          ...(post
            ? {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: current.id }),
              }
            : {}),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error("Counter unavailable");
        const data = await response.json();
        if (!Number.isSafeInteger(data.total) || data.total < 0)
          throw new Error("Invalid count");
        if (post) {
          current.sent = true;
          persist(current);
        }
        if (active) {
          setTotal((previous) => Math.max(previous ?? 0, data.total));
          setStatus("Sessions counted from Section 2");
        }
        // A Section 2 action may have happened while the initial GET was pending.
        retry = current.qualified && !current.sent;
      } catch {
        if (active) setStatus("Count temporarily unavailable");
        retry = true;
      } finally {
        busy = false;
        if (active && retry && attempts < 3) {
          attempts += 1;
          clearTimeout(timer);
          timer = setTimeout(refresh, attempts * 2000);
        }
      }
    }
    function qualify() {
      const current = session();
      current.qualified = true;
      persist(current);
      if (!current.sent) {
        attempts = 0;
        void refresh();
      }
    }
    function reconnect() {
      attempts = 0;
      void refresh();
    }
    window.addEventListener("turning-manor:qualified-use", qualify);
    window.addEventListener("online", reconnect);
    void refresh();
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("turning-manor:qualified-use", qualify);
      window.removeEventListener("online", reconnect);
    };
  }, []);
  return (
    <Frame
      role="status"
      aria-label={`Tracker sessions: ${total ?? "unavailable"}. ${status}`}
    >
      <small>TRACKER SESSIONS</small>
      <Digits aria-hidden="true">
        {(total === null ? "------" : String(total).padStart(6, "0"))
          .split("")
          .map((digit, i) => (
            <span key={i}>{digit}</span>
          ))}
      </Digits>
      <small>{status}</small>
    </Frame>
  );
}
