import { useRef, useState } from "react";
import styled from "styled-components";
import { STUDIO_ROOMS, studioEntries } from "./trackerState";

const Panel = styled.section`
  padding: 18px;
  margin: 18px 0;
  background: #39281e;
  border: 3px double #b49360;
  color: #eee2ce;
  h2,
  h3 {
    margin: 0 0 10px;
    font-family: Georgia, serif;
    font-weight: normal;
  }
  p {
    font-size: 0.85rem;
  }
  button {
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid #b49360;
    background: #30231c;
    color: #eee2ce;
    cursor: pointer;
    border-radius: 4px;
  }
  button[aria-pressed="true"] {
    background: #550000;
    border-color: #f5d58c;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0;
  }
`;
const FloorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  .floor-copy {
    min-width: 0;
    flex: 1;
  }
  h2 {
    font-size: clamp(1.2rem, 4vw, 1.6rem);
  }
  @media (max-width: 380px) {
    gap: 8px;
  }
`;
const HelpDialog = styled.dialog`
  width: min(520px, calc(100% - 24px));
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 24px;
  color: #eee2ce;
  background: #39281e;
  border: 3px double #b49360;
  box-shadow: 0 18px 60px #0009;
  &::backdrop {
    background: #000a;
  }
  p {
    line-height: 1.6;
  }
`;
const Plan = styled.nav`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  button {
    border: 4px double #b49360;
    border-radius: 16px 16px 0 0;
    padding: 16px;
  }
  .route-label {
    text-align: center;
    color: #dfcba8;
    font-size: 0.8rem;
  }
`;
const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;
const Card = styled.article`
  padding: 14px;
  color: #263321;
  background: #a5b797;
  border: 3px ridge #b49360;
  box-shadow: 0 4px 8px #0005;
  label {
    display: grid;
    gap: 6px;
    margin: 10px 0;
    font-size: 0.85rem;
  }
  textarea {
    width: 100%;
    min-height: 80px;
    padding: 8px;
    font: inherit;
    color: #35251d;
    background: #e9dfc8;
    resize: vertical;
  }
  p {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
`;
const TYPES = ["Painting", "Instrument", "Plant"];
const ANSWERS = [
  ["same", "Looks the same"],
  ["different", "Something’s different"],
  ["unsure", "Not sure · Revisit"],
];
export default function StudioTracker({
  wing,
  ElevatorIndicator,
  onUpdate,
  onAdvance,
  onExport,
  onSetup,
  message,
  error,
}) {
  const helpDialog = useRef(null);
  const [viewReference, setViewReference] = useState(false);
  const [removing, setRemoving] = useState(null);
  const guided = wing.notebookMode === "guided";
  const entries = studioEntries(wing.studioEntries, wing.notebookMode);
  const flat = STUDIO_ROOMS.flatMap((area) => entries[area]);
  const canAssess = wing.floor > 0 && !viewReference && !wing.complete;
  const editing = wing.floor === 0 || viewReference;
  const checked = flat.filter((x) => x.type && x.status).length;
  const different = flat.filter((x) => x.status === "different").length;
  const unsure = flat.filter((x) => x.status === "unsure").length;
  function change(area, id, patch) {
    onUpdate((old) => ({
      ...old,
      studioEntries: {
        ...studioEntries(old.studioEntries, old.notebookMode),
        [area]: studioEntries(old.studioEntries, old.notebookMode)[area].map(
          (x) => (x.id === id ? { ...x, ...patch } : x),
        ),
      },
    }));
  }
  function advance(pass) {
    setViewReference(false);
    setRemoving(null);
    onAdvance(pass);
  }
  function jump(area) {
    const el = document.getElementById(`studio-${STUDIO_ROOMS.indexOf(area)}`);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "start" });
  }
  const controls = (
    <div className="actions">
      {wing.complete ? (
        <button onClick={() => advance(false)}>Start another run</button>
      ) : viewReference ? (
        <button onClick={() => setViewReference(false)}>
          Return to current floor
        </button>
      ) : (
        <>
          <button onClick={() => advance(true)}>
            {wing.floor === 0
              ? wing.retryFloor
                ? `Retry floor ${wing.retryFloor}`
                : "Finish Primer Floor · Go to floor 1"
              : wing.floor === 15
                ? "Pass · Complete wing"
                : "Pass · Next floor"}
          </button>
          {wing.floor > 0 && (
            <button onClick={() => advance(false)}>
              Fail · Review Primer Floor
            </button>
          )}
        </>
      )}
      {wing.floor > 0 && !viewReference && (
        <button onClick={() => setViewReference(true)}>View reference</button>
      )}
    </div>
  );
  return (
    <>
      <Panel>
        <FloorHeader>
          <ElevatorIndicator floor={viewReference ? 0 : wing.floor} />
          <div className="floor-copy">
            <small>{guided ? "Guided notebook" : "Blank notebook"}</small>
            <h2>
              Wing 3 ·{" "}
              {viewReference || wing.floor === 0
                ? "Primer Floor"
                : wing.complete
                  ? "Wing complete"
                  : `Floor ${wing.floor}`}
            </h2>
            <p>
              {viewReference || wing.floor === 0
                ? "8 paintings · 6 instruments · 3 plants. Describe how the paintings and plants look, and how each instrument sounds."
                : "Compare what you see and hear with your notes. Mark differences or choose Not sure to revisit."}
            </p>
            <button
              type="button"
              onClick={() => helpDialog.current?.showModal()}
            >
              Help &amp; backup
            </button>
          </div>
        </FloorHeader>
        <HelpDialog ref={helpDialog} aria-labelledby="studio-help-title">
          <h2 id="studio-help-title">Using the studio tracker</h2>
          <p>
            Record the paintings, instruments, and plants on the Primer Floor.
            On anomaly floors, compare each exhibit with your notes and choose
            Looks the same (or Sounds the same for instruments), Something’s different, or Not sure. Revisit
            uncertain items before choosing your exit.
          </p>
          <p>
            Track 8 paintings, 6 instruments, and 3 plants. Use your flashlight
            to inspect the paintings and plants. Instrument differences are in
            their sound, not their appearance. Listen to each instrument and
            record its sound on the Primer Floor.
          </p>
          <p>
            Walk through Room 1, then Room 2, then Room 3. Open decorative
            doorways separate the rooms. Select a room on the map to jump to its
            observations. Add or remove entries on the Primer Floor to match
            what you see.
          </p>
          <p>
            If you fail, review the Primer Floor and then retry the floor you
            failed. You do not have to repeat passed floors.
          </p>
          <p>
            Notes and choices save automatically in this browser. Export a
            notebook to keep a separate backup. To import a notebook, use Help
            &amp; backups in Wing 1.
          </p>
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                helpDialog.current?.close();
                onSetup();
              }}
            >
              Notebook setup
            </button>
            <button type="button" onClick={onExport}>
              Export notebook
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => helpDialog.current?.close()}
            >
              Close help
            </button>
          </div>
          {message && <p role="status">{message}</p>}
        </HelpDialog>
        <p>
          Reference recorded:{" "}
          {TYPES.map(
            (type) =>
              `${flat.filter((x) => x.type === type).length} ${type.toLowerCase()}`,
          ).join(" · ")}
          .
        </p>
        {wing.retryFloor && wing.floor === 0 && (
          <p>Review your reference, then retry floor {wing.retryFloor}.</p>
        )}
        {canAssess && (
          <p role="status">
            {checked} of your {flat.length} recorded exhibits checked ·{" "}
            {different} anomalies marked · {unsure} to revisit
          </p>
        )}
        {controls}
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <Plan aria-label="Studio room map">
          <div className="route-label">Entrance</div>
          {[
            [0, "one"],
            [1, "two"],
            [2, "three"],
          ].map(([i]) => {
            const area = STUDIO_ROOMS[i];
            const items = entries[area];
            return (
              <button key={area} onClick={() => jump(area)}>
                {area}
                <br />
                {canAssess
                  ? `${items.filter((x) => x.type && x.status).length}/${items.length} checked`
                  : `${items.length} ${guided ? "slots" : "added"}`}
                {canAssess && (
                  <>
                    <br />
                    {items.filter((x) => x.status === "different").length}{" "}
                    marked · {items.filter((x) => x.status === "unsure").length}{" "}
                    revisit
                  </>
                )}
              </button>
            );
          })}
          <div className="route-label">Exit</div>
        </Plan>
      </Panel>
      {STUDIO_ROOMS.map((area, index) => (
        <Panel
          key={area}
          id={`studio-${index}`}
          tabIndex={-1}
          style={{ scrollMarginTop: 20 }}
        >
          <h3>{area}</h3>
          {guided && (
            <p>
              {index === 2 ? "2 paintings" : "3 paintings"} · 2 instruments · 1
              plant
            </p>
          )}
          <Cards>
            {entries[area].map((item, i) => (
              <Card key={item.id}>
                <strong>
                  Observation {i + 1}
                  {item.type ? ` · ${item.type}` : ""}
                </strong>
                {editing ? (
                  <>
                    <div
                      className="actions"
                      role="group"
                      aria-label={`${area}, exhibit ${i + 1} type`}
                    >
                      {TYPES.map((type) => (
                        <button
                          key={type}
                          aria-pressed={item.type === type}
                          onClick={() =>
                            change(area, item.id, { type, status: null })
                          }
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <label>
                      {item.type === "Instrument" ? "Location and sound notes" : "Location and appearance notes"}
                      <textarea
                        value={item.notes}
                        placeholder={item.type === "Instrument" ? "Where is this instrument? Describe how it sounds." : "Where in this room? Describe how this item looks."}
                        onChange={(e) =>
                          change(area, item.id, { notes: e.target.value })
                        }
                      />
                    </label>
                    {removing === item.id ? (
                      <div className="actions">
                        <button
                          onClick={() => {
                            onUpdate((old) => ({
                              ...old,
                              studioEntries: {
                                ...studioEntries(
                                  old.studioEntries,
                                  old.notebookMode,
                                ),
                                [area]: studioEntries(
                                  old.studioEntries,
                                  old.notebookMode,
                                )[area].filter((x) => x.id !== item.id),
                              },
                            }));
                            setRemoving(null);
                          }}
                        >
                          Confirm removal
                        </button>
                        <button onClick={() => setRemoving(null)}>
                          Keep exhibit
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setRemoving(item.id)}>
                        Remove slot
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p>{item.notes || (item.type === "Instrument" ? "No sound notes saved." : "No appearance notes saved.")}</p>
                    {!item.type && (
                      <p>
                        Add an item type in View reference before checking this
                        exhibit.
                      </p>
                    )}
                    {canAssess && (
                      <div
                        className="actions"
                        role="group"
                        aria-label={`${area}, exhibit ${i + 1} assessment`}
                      >
                        {ANSWERS.map(([status, label]) => (
                          <button
                            key={status}
                            disabled={!item.type}
                            aria-pressed={item.status === status}
                            onClick={() => change(area, item.id, { status })}
                          >
                            {item.type === "Instrument" && status === "same" ? "Sounds the same" : label}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>
            ))}
          </Cards>
          {editing && (
            <div className="actions">
              <button
                disabled={flat.length >= 100}
                onClick={() =>
                  onUpdate((old) => ({
                    ...old,
                    studioEntries: {
                      ...studioEntries(old.studioEntries, old.notebookMode),
                      [area]: [
                        ...studioEntries(old.studioEntries, old.notebookMode)[
                          area
                        ],
                        {
                          id: crypto.randomUUID(),
                          type: "",
                          notes: "",
                          status: null,
                        },
                      ],
                    },
                  }))
                }
              >
                + Add exhibit
              </button>
            </div>
          )}
        </Panel>
      ))}
      <Panel>
        {canAssess && (
          <p role="status">
            {checked} of your {flat.length} recorded exhibits checked ·{" "}
            {different} anomalies marked · {unsure} to revisit
          </p>
        )}
        {controls}
      </Panel>
    </>
  );
}
