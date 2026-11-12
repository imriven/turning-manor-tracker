import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
const Dialog = styled.dialog`
  width: min(530px, calc(100% - 24px));
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 24px;
  border: 3px double #b49360;
  background: #39281e;
  color: #eee2ce;
  &::backdrop {
    background: #000a;
  }
  h2,
  h3 {
    font-family: Georgia, serif;
  }
  p {
    line-height: 1.6;
  }
  button {
    min-height: 44px;
    padding: 10px 14px;
    margin: 4px;
    background: #550000;
    color: #eee2ce;
    border: 1px solid #b49360;
    cursor: pointer;
  }
  section {
    padding: 8px 0;
    border-bottom: 1px solid #806b47;
  }
`;
export default function NotebookSetup({ mode, wingId, onChoose, onClose }) {
  const dialog = useRef(null);
  const [pending, setPending] = useState(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function choose(value) {
    if (mode && mode !== value) setPending(value);
    else {
      onChoose(value);
      dialog.current?.close();
    }
  }
  return (
    <Dialog ref={dialog} aria-labelledby="setup-heading" onClose={onClose}>
      <h2 id="setup-heading">How would you like to build your notebook?</h2>
      <p>Choose separately for each wing. You can find this again in Help.</p>
      {pending ? (
        <>
          <p>
            {pending === "blank"
              ? "Blank mode hides distribution hints and stops adding suggested slots. All existing entries, notes, and assessments stay, so this will not empty your notebook or undo hints you already saw."
              : "Guided mode adds suggested slots where needed and shows layout hints. All your existing entries, notes, and assessments stay."}
          </p>
          <button
            onClick={() => {
              onChoose(pending);
              dialog.current?.close();
            }}
          >
            Apply {pending} mode
          </button>
          <button onClick={() => setPending(null)}>Go back</button>
        </>
      ) : (
        <>
          <section>
            <h3>Blank notebook</h3>
            <p>
              Find and add the exhibits yourself. We provide area names without
              revealing how many items belong in each area.
            </p>
            <button onClick={() => choose("blank")}>
              {mode ? "Use blank notebook" : "Start blank"}
            </button>
          </section>
          <section>
            <h3>Guided notebook</h3>
            <p>
              Start with suggested observation slots in each area. You still
              record appearances and decide what has changed.
            </p>
            {wingId === 2 && (
              <p>
                The gallery’s other wall counts are provisional, so you can
                adjust the suggested slots.
              </p>
            )}
            <button onClick={() => choose("guided")}>
              {mode ? "Use guided notebook" : "Start guided"}
            </button>
          </section>
        </>
      )}
      <button onClick={() => dialog.current?.close()}>Close</button>
    </Dialog>
  );
}
