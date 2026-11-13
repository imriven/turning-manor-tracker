import { useEffect, useRef, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import NotebookSetup from "./NotebookSetup";
import BlankHallway, { notebookSpots } from "./BlankHallway";
import GalleryTracker from "./GalleryTracker";
import { wingIsAvailable } from "./wingAvailability";
import ObservationSpot from "./ObservationSpot";
import {
  STORAGE_KEY,
  validCustomSpots,
  chooseNotebookMode,
  validGalleryEntries,
  initialState,
  restoreState,
  finishFloor,
  spaceChecked,
} from "./trackerState";

const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  body {
    margin: 0; min-width: 320px; color: #eee2ce;
    background: repeating-linear-gradient(90deg, transparent 0 78px, #3b512b0a 78px 80px), #87AE73;
    font-family: 'Avenir Next', 'Segoe UI', sans-serif;
    line-height: 1.5;
  }
  button { font: inherit; }
  button:focus-visible, a:focus-visible, textarea:focus-visible { outline: 3px solid #e2bd74; outline-offset: 4px; }
`;
const Page = styled.main`
  max-width: 1220px;
  margin: 0 auto;
  padding: 24px 28px;
  @media (max-width: 760px) {
    padding: 18px 16px;
  }
`;
const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 32px;
  align-items: start;
  @media (max-width: 1000px) {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
`;
const DetailColumn = styled.div`
  min-width: 0;
  grid-column: 1;
  grid-row: 1;
  width: 100%;
`;
const Sidebar = styled.aside`
  grid-column: 2;
  grid-row: 1;
  position: sticky;
  top: 18px;
  max-height: calc(100dvh - 36px);
  overflow-y: auto;
  scrollbar-width: thin;
  @media (max-width: 1000px) {
    top: 0;
    z-index: 10;
    width: 100%;
    max-height: none;
    overflow: visible;
    background: #2c201af5;
    border: 1px solid #66543d;
  }
`;
const MobileSummary = styled.div`
  display: none;
  @media (max-width: 1000px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 12px;
    font-size: 0.75rem;
    strong {
      color: #f1d9a6;
    }
    button {
      padding: 9px 12px;
      background: #550000;
      color: #fff3de;
      border: 1px solid #b49360;
      cursor: pointer;
    }
  }
`;
const MapPanel = styled.div`
  @media (max-width: 1000px) {
    display: ${({ $open }) => ($open ? "block" : "none")};
    max-height: 65dvh;
    overflow-y: auto;
  }
`;
const Header = styled.header`
  color: #3a1814;
  margin-bottom: 16px;
  text-align: center;
  p {
    margin: 4px 0;
    color: #38472b;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  h1 {
    margin: 4px 0;
    font:
      normal clamp(2.2rem, 6vw, 3.8rem)/1.1 Georgia,
      serif;
  }
`;
const WingMenu = styled.nav`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 10px;
  @media (max-width: 540px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;
const WingButton = styled.button`
  padding: 9px 4px;
  border: 1px solid ${({ $active }) => ($active ? "#d4b477" : "#66543d")};
  border-radius: 4px;
  color: ${({ $active }) => ($active ? "#fff3de" : "#cdbb9e")};
  background: ${({ $active }) => ($active ? "#550000" : "#30231c")};
  cursor: pointer;
  small {
    display: block;
    margin-top: 6px;
    font-size: 0.65rem;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;
const FloorBar = styled.section`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  margin-bottom: 18px;
  border: 1px solid #b49360;
  border-radius: 6px;
  background: #30231c;
  box-shadow:
    inset 0 0 0 3px #211813,
    0 3px 8px #0003;
  .floor-copy {
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0;
    color: #f1d9a6;
    font:
      normal 1.2rem Georgia,
      serif;
  }
  p {
    margin: 5px 0;
    font-size: 0.78rem;
    color: #e4d5bd;
  }
  @media (max-width: 540px) {
    gap: 10px;
    padding: 12px;
    align-items: flex-start;
  }
`;
const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  button {
    min-height: 44px;
    padding: 8px 12px;
    font-size: 0.75rem;
  }
`;
const Dial = styled.svg`
  width: 170px;
  flex: 0 0 170px;
  height: auto;
  @media (max-width: 540px) {
    width: 110px;
    flex-basis: 110px;
  }
`;
function ElevatorDial({ floor }) {
  const angle = Math.PI + (floor / 16) * Math.PI;
  return (
    <Dial
      viewBox="0 0 200 132"
      role="img"
      aria-label={
        floor === 0
          ? "Elevator indicator: Primer Floor"
          : `Elevator indicator: floor ${floor} of 16`
      }
    >
      <path
        d="M8 112 V100 A92 92 0 0 1 192 100 V112 Z"
        fill="#b49360"
        stroke="#e2c78c"
        strokeWidth="2"
      />
      <path
        d="M15 105 V100 A85 85 0 0 1 185 100 V105 Z"
        fill="#e9dfc8"
        stroke="#60482e"
        strokeWidth="3"
      />
      {Array.from({ length: 17 }, (_, i) => {
        const a = Math.PI + (i / 16) * Math.PI;
        return (
          <text
            key={i}
            x={100 + Math.cos(a) * 72}
            y={100 + Math.sin(a) * 72}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#40251a"
            fontFamily="Georgia,serif"
            fontSize="11"
          >
            {i === 0 ? "P" : i}
          </text>
        );
      })}
      <line
        x1="100"
        y1="100"
        x2={100 + Math.cos(angle) * 58}
        y2={100 + Math.sin(angle) * 58}
        stroke="#550000"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle
        cx="100"
        cy="100"
        r="7"
        fill="#8a622e"
        stroke="#e6c990"
        strokeWidth="2"
      />
      <text
        x="100"
        y="126"
        textAnchor="middle"
        fill="#f1d9a6"
        fontSize="12"
        fontFamily="Georgia,serif"
      >
        {floor === 0 ? "PRIMER FLOOR" : `FLOOR ${floor} / 16`}
      </text>
    </Dial>
  );
}
const NotebookDialog = styled.dialog`
  width: min(520px, calc(100% - 24px));
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 22px;
  border: 3px double #9b855b;
  border-radius: 8px;
  background: #e9dfc8;
  color: #35251d;
  box-shadow: 0 20px 70px #0008;
  &::backdrop {
    background: #16100dcc;
  }
  h2 {
    margin: 0;
    font:
      normal 1.5rem Georgia,
      serif;
  }
  p {
    font-size: 0.85rem;
  }
  .dialog-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
`;
const SectionFrame = styled.section`
  background:
    repeating-linear-gradient(
      90deg,
      #ffffff02 0 2px,
      #00000005 2px 5px,
      transparent 5px 13px
    ),
    linear-gradient(90deg, #302018, #493326 50%, #302018) !important;

  position: relative;
  padding: 26px;
  border-radius: 12px 12px 3px 3px;
  background-image: linear-gradient(135deg, #b4936009, transparent 50%);
  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 8px;
    width: 14px;
    height: 14px;
    border-top: 2px solid #c4a575;
    pointer-events: none;
  }
  &::before {
    left: 8px;
    border-left: 2px solid #c4a575;
  }
  &::after {
    right: 8px;
    border-right: 2px solid #c4a575;
  }
  @media (max-width: 540px) {
    padding: 18px 12px;
  }
  border: 1px solid #947746;
  outline: 1px solid #4e412f;
  outline-offset: 5px;
  background: #2c211b;
  box-shadow: 0 16px 50px #00000040;
`;
const SectionHeading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid #514330;
  h2 {
    margin: 0;
    font-family: "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif;
    font-size: 1.4rem;
    font-weight: normal;
  }
  span {
    color: #b9a68a;
    font-size: 0.75rem;
  }
`;
const HallwayGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 48px minmax(0, 1fr);
  row-gap: 14px;
  margin-top: 20px;
  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr) 28px minmax(0, 1fr);
  }
`;
const SideLabel = styled.div`
  padding-bottom: 8px;
  color: #b9a68a;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
`;
const Corridor = styled.div`
  margin: -7px 8px;
  border-left: 1px dashed #9b855b;
  border-right: 1px dashed #9b855b;
  background: #bba06814;
`;
const Door = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 230px;
  padding: 28px 26px 65px;
  border: 7px solid #382417;
  border-top-width: 10px;
  border-radius: 5px 5px 1px 1px;
  background:
    repeating-linear-gradient(90deg, transparent 0 6px, #ba91620b 6px 8px),
    linear-gradient(90deg, #352217, #65452f 48%, #352217);
  box-shadow:
    0 5px 9px #0007,
    inset 0 0 0 2px #aa8050,
    inset 4px 0 10px #0007,
    0 0 0 1px #ba9360;
  &::before {
    content: "";
    position: absolute;
    inset: 14px 13px 68px;
    border: 2px solid #26190f;
    border-bottom-color: #956d43;
    box-shadow:
      inset 1px 2px 5px #0008,
      0 1px #bc91594d;
    pointer-events: none;
  }
  &::after {
    content: "";
    position: absolute;
    left: 13px;
    right: 13px;
    bottom: 12px;
    height: 40px;
    border: 2px solid #26190f;
    border-bottom-color: #956d43;
    box-shadow: inset 1px 2px 5px #0008;
    pointer-events: none;
  }
  @media (max-width: 480px) {
    min-height: 210px;
    padding: 24px 18px 65px;
  }
`;
const DoorPlaque = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 5px 14px;
  border: 1px solid #e1c58a;
  border-radius: 30% / 15%;
  color: #2d1c0d;
  background: linear-gradient(135deg, #987039, #e5c68b 45%, #ab8048);
  box-shadow:
    0 2px 4px #0008,
    inset 0 0 0 2px #5e431c;
  span {
    display: block;
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.13em;
  }
  strong {
    display: block;
    font:
      normal 1.55rem Georgia,
      serif;
    line-height: 1.1;
  }
`;
const Peephole = styled.div`
  position: relative;
  margin-top: 19px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 3px solid #b58c4b;
  background: radial-gradient(circle at 35% 30%, #729095 0 12%, #10130f 35%);
  box-shadow:
    0 1px 3px #000,
    0 0 0 1px #e3c687;
`;
const BrassKnob = styled.div`
  position: absolute;
  top: 60%;
  right: 14px;
  width: 23px;
  height: 23px;
  border-radius: 50%;
  border: 1px solid #684919;
  background: radial-gradient(
    circle at 30% 25%,
    #fff0bc,
    #c49b52 35%,
    #79501e 78%
  );
  box-shadow:
    2px 4px 4px #0009,
    0 0 0 3px #a17a3e,
    0 0 0 4px #4a3118;
`;
const HallwayStack = styled.div`
  display: grid;
  gap: 32px;
`;
const CornerSpace = styled.div`
  max-width: 320px;
  margin: 20px auto 0;
`;
const Controls = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 22px 0;
`;
const Control = styled.button`
  min-height: 46px;
  padding: 12px 18px;
  border: 1px solid #b49360;
  border-radius: 4px;
  background: ${({ $primary }) => ($primary ? "#550000" : "#35251d")};
  color: #eee2ce;
  cursor: pointer;
  &:hover {
    border-color: #f1d9a6;
  }
`;
const Status = styled.p`
  text-align: center;
  color: #303e2d;
  font-size: 0.75rem;
  line-height: 1.6;
`;
const Footer = styled.footer`
  padding: 28px 20px;
  background: linear-gradient(90deg, #302018, #493326, #302018);
  border: 1px solid #b49360;
  margin-top: 48px;
  padding-top: 28px;
  border-top: 1px solid #64553e;
  text-align: center;
  p {
    margin-top: 18px;
    color: #e0cfb2;
    font-size: 0.75rem;
    line-height: 1.8;
  }
`;
const FooterActions = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
`;
const FooterLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 220px;
  max-width: 320px;
  min-height: 54px;
  padding: 16px 24px;
  border: 1px solid ${({ $primary }) => ($primary ? "#d4b477" : "#b49360")};
  border-radius: 4px;
  background: ${({ $primary }) => ($primary ? "#550000" : "#35251d")};
  color: ${({ $primary }) => ($primary ? "#fff3de" : "#ead6b4")};
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  &:hover {
    background: ${({ $primary }) => ($primary ? "#740e17" : "#51392a")};
    border-color: #f1d9a6;
  }
`;

const SpotAnchor = styled.div`
  min-width: 0;
  scroll-margin-top: 110px;
  &:focus {
    outline: 3px solid #e2bd74;
    outline-offset: 4px;
  }
`;
const Overview = styled.section`
  p {
    color: #e4d5bd;
  }
  margin: 0;
  padding: 16px;
  border: 1px solid #806b47;
  background: #30231c;
  border-radius: 4px;
  h2 {
    margin: 0;
    font-family: "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif;
    font-weight: normal;
  }
`;
const Total = styled.p`
  padding: 14px;
  margin: 16px 0;
  text-align: center;
  border: 1px solid #b49360;
  background: #550000;
  color: #fff3de;
  strong {
    font-size: 1.5rem;
    margin-left: 8px;
  }
`;
const MiniHall = styled.div`
  max-width: 400px;
  margin: 0 auto;
  display: grid;
  gap: 7px;
`;
const MiniSection = styled.div`
  padding: 8px;
  border: 1px solid #64553e;
`;
const MiniGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 28px minmax(0, 1fr);
  gap: 4px;
`;
const MiniSpot = styled.button`
  min-height: 36px;
  padding: 6px;
  border-radius: 3px;
  border: 1px solid ${({ $marked }) => ($marked ? "#e2bd74" : "#64553e")};
  background: ${({ $marked }) => ($marked ? "#550000" : "#382c23")};
  color: #eee2ce;
  cursor: pointer;
  box-shadow: ${({ $unsure }) => ($unsure ? "inset 0 0 0 2px #efbd65" : "none")};
  background: ${({ $marked, $unsure }) => ($marked ? "#550000" : $unsure ? "#594018" : "#382c23")};
  font-size: 0.7rem;
  &:hover {
    border-color: #f1d9a6;
  }
`;
const MiniDoor = styled.span`
  text-align: center;
  font-size: 0.65rem;
  color: #c4a575;
  padding: 4px;
`;
function markedAt(flags, id) {
  return ["Plant", "Painting", "Shelf", "appeared"].filter(
    (item) => flags[`${id}-${item}`] === "different",
  ).length;
}
function unsureAt(flags, id) {
  return ["Plant", "Painting", "Shelf", "appeared"].filter(
    (item) => flags[`${id}-${item}`] === "unsure",
  ).length;
}
function allSpotIds() {
  return [1, 2, 3, 4, 5]
    .flatMap((section) =>
      ["odd", "even"].flatMap((side) =>
        ["before", "after"].map(
          (position) => `s${section}-${side}-${position}`,
        ),
      ),
    )
    .concat("end-corner");
}
function HallwayOverview({
  flags,
  references,
  floor,
  total,
  revisit,
  onJump,
  checking,
}) {
  function jump(id) {
    const target = document.getElementById(`spot-${id}`);
    if (!target) return;
    onJump();
    requestAnimationFrame(() => {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "center", behavior: "auto" });
    });
  }
  function cell(id, location) {
    const count = markedAt(flags, id);
    const unsure = unsureAt(flags, id);
    const checked = spaceChecked(references[id], flags, id);
    const progressLabel = checking
      ? checked
        ? "Checked"
        : references[id]
          ? "Needs checking"
          : "Add reference"
      : references[id]
        ? "Recorded"
        : "Not added yet";
    return (
      <MiniSpot
        type="button"
        $marked={count > 0}
        $unsure={unsure > 0}
        aria-label={`${location}: ${progressLabel}. ${count} anomalies marked, ${unsure} items to revisit. Jump to observation.`}
        onClick={() => jump(id)}
      >
        {progressLabel}
        {(count > 0 || unsure > 0) && (
          <span style={{ display: "block" }}>
            {[count ? `${count} marked` : "", unsure ? `${unsure} revisit` : ""]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
      </MiniSpot>
    );
  }
  return (
    <Overview aria-labelledby="hallway-overview">
      <h2 id="hallway-overview">Hallway overview</h2>
      <Total role="status" aria-live="polite" aria-atomic="true">
        {floor === 0 ? "Primer Floor" : `Floor ${floor}`} · Anomalies marked:{" "}
        <strong>{total}</strong> · Items to revisit: <strong>{revisit}</strong>
      </Total>
      <Status>
        Even side left · Odd side right. Select a space to jump to it. Maroon
        spaces contain your suspected anomalies.
      </Status>
      <MiniHall>
        {[1, 2, 3, 4, 5].map((section) => {
          const odd = String(section * 2 - 1).padStart(2, "0");
          const even = String(section * 2).padStart(2, "0");
          return (
            <MiniSection key={section}>
              <MiniDoor as="div">Section {section}</MiniDoor>
              <MiniGrid>
                {cell(
                  `s${section}-even-before`,
                  `Section ${section}, even side before door ${even}`,
                )}
                <Corridor aria-hidden="true" />
                {cell(
                  `s${section}-odd-before`,
                  `Section ${section}, odd side before door ${odd}`,
                )}
                <MiniDoor>Door {even}</MiniDoor>
                <Corridor aria-hidden="true" />
                <MiniDoor>Door {odd}</MiniDoor>
                {cell(
                  `s${section}-even-after`,
                  `Section ${section}, even side after door ${even}`,
                )}
                <Corridor aria-hidden="true" />
                {cell(
                  `s${section}-odd-after`,
                  `Section ${section}, odd side after door ${odd}`,
                )}
              </MiniGrid>
            </MiniSection>
          );
        })}
        <MiniSection>
          <MiniDoor as="div">End corner</MiniDoor>
          {cell("end-corner", "End corner")}
        </MiniSection>
      </MiniHall>
    </Overview>
  );
}

function validateNotebook(value) {
  const record = (x) =>
    x !== null && typeof x === "object" && !Array.isArray(x);
  if (
    !record(value) ||
    value.app !== "turning-manor-notebook" ||
    ![1, 2].includes(value.version) ||
    !record(value.state) ||
    !record(value.state.wings)
  ) {
    throw new Error(
      "Choose an exported Turning Manor notebook (version 1 or 2).",
    );
  }
  const ids = new Set(allSpotIds());
  const types = ["Plant", "Painting", "Shelf", "Empty"];
  const flagIds = new Set(
    [...ids].flatMap((id) =>
      ["Plant", "Painting", "Shelf", "appeared"].map((type) => `${id}-${type}`),
    ),
  );
  if (
    Object.keys(value.state.wings).some(
      (id) => !["1", "2", "3", "4"].includes(id),
    )
  )
    throw new Error("This notebook contains an unknown wing.");
  for (const id of [1, 2, 3, 4]) {
    const wing = value.state.wings[id];
    if (
      !record(wing) ||
      !Number.isInteger(wing.floor) ||
      wing.floor < (value.version === 1 ? 1 : 0) ||
      wing.floor > 16 ||
      typeof wing.complete !== "boolean" ||
      (wing.complete && wing.floor !== 16) ||
      (wing.retryFloor != null &&
        (!Number.isInteger(wing.retryFloor) ||
          wing.retryFloor < 1 ||
          wing.retryFloor > 16 ||
          wing.floor !== 0 ||
          wing.complete)) ||
      (wing.galleryNotes != null &&
        (!record(wing.galleryNotes) ||
          Object.values(wing.galleryNotes).some(
            (note) => typeof note !== "string",
          ))) ||
      !validGalleryEntries(wing.galleryEntries) ||
      !validCustomSpots(wing.customSpots) ||
      (wing.notebookMode != null &&
        !["blank", "guided"].includes(wing.notebookMode)) ||
      !record(wing.references) ||
      !record(wing.flags)
    )
      throw new Error("This notebook has invalid floor data.");
    const customIds = new Set((wing.customSpots ?? []).map((x) => x.id));
    const customFlags = new Set(
      [...customIds].flatMap((key) =>
        ["Plant", "Painting", "Shelf", "appeared"].map(
          (type) => `${key}-${type}`,
        ),
      ),
    );
    for (const [spot, ref] of Object.entries(wing.references)) {
      if (
        (!ids.has(spot) && !customIds.has(spot)) ||
        !record(ref) ||
        !Array.isArray(ref.items) ||
        ref.items.length < 1 ||
        ref.items.length > 2 ||
        new Set(ref.items).size !== ref.items.length ||
        ref.items.some((type) => !types.includes(type)) ||
        (ref.items.includes("Empty") && ref.items.length !== 1) ||
        !record(ref.notes) ||
        Object.values(ref.notes).some((note) => typeof note !== "string")
      )
        throw new Error("This notebook has invalid reference notes.");
    }
    for (const [flag, status] of Object.entries(wing.flags)) {
      if (
        (!flagIds.has(flag) && !customFlags.has(flag)) ||
        !["same", "different", "unsure"].includes(status)
      )
        throw new Error("This notebook has invalid observations.");
    }
  }
  return restoreState(
    JSON.stringify({ ...value.state, version: value.version }),
  );
}
const wings = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

function HallwaySection({ sectionNumber, renderSpot, progressText }) {
  const odd = String(sectionNumber * 2 - 1).padStart(2, "0");
  const even = String(sectionNumber * 2).padStart(2, "0");
  return (
    <SectionFrame aria-labelledby={`section-${sectionNumber}`}>
      <SectionHeading>
        <h2 id={`section-${sectionNumber}`}>
          Section {String(sectionNumber).padStart(2, "0")}
        </h2>
        <span>
          Rooms {even} / {odd}
          {progressText && (
            <small style={{ display: "block" }}>{progressText}</small>
          )}
        </span>
      </SectionHeading>
      <HallwayGrid>
        <SideLabel>Even side</SideLabel>
        <div aria-hidden="true" />
        <SideLabel>Odd side</SideLabel>
        {renderSpot(
          `s${sectionNumber}-even-before`,
          `Even side, before door ${even}`,
        )}
        <Corridor aria-hidden="true" />
        {renderSpot(
          `s${sectionNumber}-odd-before`,
          `Odd side, before door ${odd}`,
        )}
        <Door aria-label={`Room ${even}`}>
          <DoorPlaque>
            <span>Room</span>
            <strong>{even}</strong>
          </DoorPlaque>
          <Peephole aria-hidden="true" />
          <BrassKnob aria-hidden="true" />
        </Door>
        <Corridor aria-hidden="true" />
        <Door aria-label={`Room ${odd}`}>
          <DoorPlaque>
            <span>Room</span>
            <strong>{odd}</strong>
          </DoorPlaque>
          <Peephole aria-hidden="true" />
          <BrassKnob aria-hidden="true" />
        </Door>
        {renderSpot(
          `s${sectionNumber}-even-after`,
          `Even side, after door ${even}`,
        )}
        <Corridor aria-hidden="true" />
        {renderSpot(
          `s${sectionNumber}-odd-after`,
          `Odd side, after door ${odd}`,
        )}
      </HallwayGrid>
    </SectionFrame>
  );
}

export default function App() {
  const [loaded] = useState(() => {
    try {
      return {
        state: restoreState(localStorage.getItem(STORAGE_KEY)),
        error: "",
      };
    } catch {
      return {
        state: initialState(),
        error:
          "Previous progress could not be loaded. Saving is paused to protect it.",
      };
    }
  });
  const [state, setState] = useState(loaded.state);
  const [setupOpen, setSetupOpen] = useState(false);
  const [now, setNow] = useState(Date.now);
  const isDevelopment = import.meta.env.DEV;
  const available = (id) => wingIsAvailable(id, now, isDevelopment);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const [saveError, setSaveError] = useState(loaded.error);
  const [referenceView, setReferenceView] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const importInput = useRef(null);
  const notebookDialog = useRef(null);
  const spoilerDialog = useRef(null);
  const spoilerTrigger = useRef(null);
  const visitedWings = useRef(new Set());
  const [pendingWing, setPendingWing] = useState(null);
  const [rememberWing, setRememberWing] = useState(false);
  const [spoilerPreferences, setSpoilerPreferences] = useState(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("turning-manor-spoiler-preferences-v1"),
        ) || {}
      );
    } catch {
      return {};
    }
  });
  useEffect(() => {
    if (pendingWing !== null && !spoilerDialog.current?.open)
      spoilerDialog.current?.showModal();
  }, [pendingWing]);
  function selectWing(id) {
    if (!available(id)) return;
    setState((previous) => ({ ...previous, activeWing: id }));
    setReferenceView(false);
    setMapOpen(false);
  }
  function requestWing(id, trigger) {
    if (!available(id) || id === activeWing) return;
    if (
      id === 1 ||
      visitedWings.current.has(id) ||
      spoilerPreferences?.[id] === true
    ) {
      selectWing(id);
      return;
    }
    spoilerTrigger.current = trigger;
    setRememberWing(false);
    setPendingWing(id);
  }
  function openPendingWing() {
    if (pendingWing === null) return;
    visitedWings.current.add(pendingWing);
    if (rememberWing) {
      const next = { ...spoilerPreferences, [pendingWing]: true };
      setSpoilerPreferences(next);
      try {
        localStorage.setItem(
          "turning-manor-spoiler-preferences-v1",
          JSON.stringify(next),
        );
      } catch {
        /* Session acknowledgement still works. */
      }
    }
    selectWing(pendingWing);
    spoilerDialog.current?.close();
  }
  const notebookTrigger = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [notebookMessage, setNotebookMessage] = useState("");
  const [importRevision, setImportRevision] = useState(0);
  const [savingPaused, setSavingPaused] = useState(Boolean(loaded.error));
  const activeWing = available(state.activeWing) ? state.activeWing : 1;
  const current = state.wings[activeWing];
  const blankMode = current.notebookMode === "blank";
  const spotIds = blankMode
    ? notebookSpots(current).map((x) => x.id)
    : [...allSpotIds(), ...(current.customSpots ?? []).map((x) => x.id)];
  useEffect(() => {
    setSetupOpen(!current.notebookMode);
  }, [activeWing, current.notebookMode, importRevision]);
  function openSetup() {
    notebookDialog.current?.close();
    setSetupOpen(true);
  }
  function applyMode(mode) {
    updateWing((wing) => chooseNotebookMode(wing, mode, activeWing));
  }

  const anomalyTotal = spotIds.reduce(
    (total, id) => total + markedAt(current.flags, id),
    0,
  );
  const revisitTotal = spotIds.reduce(
    (total, id) => total + unsureAt(current.flags, id),
    0,
  );
  const unchecked = spotIds.filter(
    (id) => !spaceChecked(current.references[id], current.flags, id),
  );
  const checkedCount = spotIds.length - unchecked.length;
  function jumpToUnchecked() {
    setMapOpen(false);
    requestAnimationFrame(() => {
      const target = document.getElementById(`spot-${unchecked[0]}`);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "center", behavior: "auto" });
    });
  }
  const canFlag = current.floor > 0 && !referenceView && !current.complete;

  useEffect(() => {
    if (savingPaused) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaveError("");
    } catch {
      setSaveError(
        "Saving is unavailable. Keep this tab open; changes may be lost on refresh.",
      );
    }
  }, [state, savingPaused]);

  function updateWing(change) {
    setState((previous) => ({
      ...previous,
      wings: {
        ...previous.wings,
        [activeWing]: change(previous.wings[activeWing]),
      },
    }));
  }
  function saveReference(id, reference) {
    updateWing((wing) => ({
      ...wing,
      references: { ...wing.references, [id]: reference },
      flags: Object.fromEntries(
        Object.entries(wing.flags).filter(([key]) => !key.startsWith(`${id}-`)),
      ),
    }));
  }
  function toggleFlag(id, item, status) {
    if (!canFlag) return;
    updateWing((wing) => ({
      ...wing,
      flags: { ...wing.flags, [`${id}-${item}`]: status },
    }));
  }
  function exportNotebook() {
    try {
      const data = {
        app: "turning-manor-notebook",
        version: 2,
        exportedAt: new Date().toISOString(),
        state,
      };
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `turning-manor-notebook-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotebookMessage(
        "Notebook download started. It includes saved references and current progress.",
      );
    } catch {
      setNotebookMessage(
        "Could not export this notebook. Your current notes are unchanged.",
      );
    }
  }
  async function readNotebook(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPendingImport(null);
    try {
      if (file.size > 1024 * 1024)
        throw new Error("Choose a notebook smaller than 1 MB.");
      const imported = validateNotebook(JSON.parse(await file.text()));
      setPendingImport({ name: file.name, state: imported });
      setNotebookMessage(
        "Notebook checked. Review below before replacing your current notebook.",
      );
    } catch (error) {
      setNotebookMessage(
        error instanceof SyntaxError
          ? "That file is not valid JSON. Your notebook is unchanged."
          : `${error.message} Your notebook is unchanged.`,
      );
    }
  }
  function applyImport() {
    if (!pendingImport) return;
    setState(pendingImport.state);
    setSavingPaused(false);
    setReferenceView(false);
    setImportRevision((value) => value + 1);
    setPendingImport(null);
    setNotebookMessage("Notebook imported.");
  }
  function advance(passed) {
    updateWing((wing) => finishFloor(wing, passed));
    setReferenceView(false);
    setMapOpen(false);
    requestAnimationFrame(() => {
      document.getElementById("tracker-title")?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    setAnnouncement(
      passed
        ? current.floor === 16
          ? "Wing complete!"
          : `Now on floor ${current.floor === 0 ? (current.retryFloor ?? 1) : current.floor + 1}.`
        : current.complete
          ? "New run. Your reference notes are preserved."
          : `Returned to the Primer Floor. Retry floor ${current.floor || current.retryFloor || 1} when ready.`,
    );
  }
  function renderSpot(id, location) {
    const flags = Object.fromEntries(
      ["Plant", "Painting", "Shelf", "appeared"].map((item) => [
        item,
        current.flags[`${id}-${item}`],
      ]),
    );
    return (
      <SpotAnchor
        id={`spot-${id}`}
        tabIndex={-1}
        role="group"
        aria-label={location}
        key={`${activeWing}-${id}`}
      >
        <ObservationSpot
          key={`${importRevision}-${activeWing}-${id}-${current.floor}-${referenceView}-${current.complete}`}
          location={location}
          reference={current.references[id] ?? null}
          flags={flags}
          canFlag={canFlag}
          onToggle={(item, status) => toggleFlag(id, item, status)}
          onSave={(reference) => saveReference(id, reference)}
        />
      </SpotAnchor>
    );
  }
  return (
    <>
      <GlobalStyle />
      <Page>
        <Header>
          <p>Rockagoth’s Field Notes</p>
          <h1 id="tracker-title" tabIndex={-1}>
            Turning Manor
          </h1>
          <p>Anomaly tracker</p>
        </Header>
        <WingMenu aria-label="Choose a wing">
          {wings.map((wing) => (
            <WingButton
              key={wing.id}
              type="button"
              $active={activeWing === wing.id}
              aria-current={activeWing === wing.id ? "page" : undefined}
              disabled={!available(wing.id)}
              onClick={(event) => requestWing(wing.id, event.currentTarget)}
            >
              Wing {wing.id}
              <small>
                {available(wing.id)
                  ? "Available"
                  : wing.id === 2
                    ? "Opens Dec 9"
                    : "Locked"}
              </small>
            </WingButton>
          ))}
        </WingMenu>
        {setupOpen && (
          <NotebookSetup
            key={`setup-${activeWing}-${importRevision}`}
            mode={current.notebookMode}
            wingId={activeWing}
            onChoose={applyMode}
            onClose={() => setSetupOpen(false)}
          />
        )}
        {!current.notebookMode ? (
          <Controls>
            <Control onClick={() => setSetupOpen(true)}>
              Choose notebook setup
            </Control>
          </Controls>
        ) : activeWing === 2 ? (
          <GalleryTracker
            key={`${activeWing}-${importRevision}`}
            wing={current}
            ElevatorIndicator={ElevatorDial}
            onUpdate={updateWing}
            onAdvance={advance}
            onSetup={openSetup}
            onExport={exportNotebook}
            message={notebookMessage}
            error={saveError}
          />
        ) : (
          <>
            <FloorBar aria-label="Current floor">
              <ElevatorDial floor={current.floor} />
              <div className="floor-copy">
                <small>
                  {blankMode ? "Blank notebook" : "Guided notebook"}
                </small>
                <h2>
                  Wing {activeWing} ·{" "}
                  {current.complete
                    ? "Wing complete"
                    : referenceView
                      ? "Reference notes"
                      : current.floor === 0
                        ? "Primer Floor"
                        : "Anomaly floor"}
                </h2>
                <p>
                  {current.floor === 0 || referenceView
                    ? "10 paintings · 2 shelves · 5 plants. Add what you see and describe its appearance."
                    : "Compare each item with your notes. Mark differences or choose Not sure to revisit."}
                </p>
                {current.floor === 0 && current.retryFloor && (
                  <p>
                    Review your reference, then retry Floor {current.retryFloor}
                    . Your earlier floors are already passed.
                  </p>
                )}
                {canFlag && (
                  <p role="status">
                    {checkedCount} of {blankMode ? "your " : ""}
                    {spotIds.length} {blankMode ? "recorded spaces" : "spaces"}{" "}
                    checked ·{" "}
                    {unchecked.length
                      ? `${unchecked.length} still need checking`
                      : "All recorded checks complete"}{" "}
                    · {revisitTotal} items to revisit
                  </p>
                )}
                <Toolbar>
                  {current.floor === 0 && current.retryFloor && (
                    <Control
                      type="button"
                      $primary
                      onClick={() => advance(true)}
                    >
                      Retry floor {current.retryFloor}
                    </Control>
                  )}
                  {canFlag && unchecked.length > 0 && (
                    <Control type="button" onClick={jumpToUnchecked}>
                      Next unchecked space
                    </Control>
                  )}
                  {current.floor > 0 && (
                    <Control
                      type="button"
                      aria-pressed={referenceView}
                      onClick={() => setReferenceView((value) => !value)}
                    >
                      {referenceView
                        ? "Back to current floor"
                        : "View reference"}
                    </Control>
                  )}
                  <Control
                    ref={notebookTrigger}
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => notebookDialog.current?.showModal()}
                  >
                    Help &amp; backups
                  </Control>
                </Toolbar>
              </div>
            </FloorBar>
            {saveError && <Status role="alert">{saveError}</Status>}
            <NotebookDialog
              ref={notebookDialog}
              aria-labelledby="notebook-heading"
              onClose={() => notebookTrigger.current?.focus()}
            >
              <div className="dialog-heading">
                <h2 id="notebook-heading">Help &amp; backups</h2>
                <Control
                  type="button"
                  autoFocus
                  onClick={() => notebookDialog.current?.close()}
                >
                  Close
                </Control>
              </div>
              <Control onClick={openSetup}>Notebook setup</Control>
              <p>
                Your progress saves in this browser. Use Save reference to keep
                item edits. Save or cancel open edits before changing floors or
                views.
              </p>
              <p>
                The game calls the reference floor the Primer Floor. It has no
                glitches. Compare the hallway’s paintings, shelves, and plants
                on later floors; ignore objects inside rooms.
              </p>
              <p>
                “Not added yet” means you haven’t made a reference for that
                space. Choose Empty when you have checked it and nothing belongs
                there.
              </p>
              <p>
                Export a backup or bring your notebook to another browser. Save
                any open item edits first.
              </p>
              <Controls>
                <Control type="button" onClick={exportNotebook}>
                  Export notebook
                </Control>
                <Control
                  type="button"
                  onClick={() => importInput.current?.click()}
                >
                  Import notebook
                </Control>
              </Controls>
              <input
                ref={importInput}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={readNotebook}
              />
              <p role="status">{notebookMessage}</p>
              {pendingImport && (
                <div>
                  <p>
                    <strong>{pendingImport.name}</strong> ·{" "}
                    {Object.values(pendingImport.state.wings).reduce(
                      (sum, wing) => sum + Object.keys(wing.references).length,
                      0,
                    )}{" "}
                    recorded spaces.
                  </p>
                  <p>
                    This replaces your current notes and progress. Export your
                    current notebook first if you want to keep both.
                  </p>
                  <Controls>
                    <Control type="button" onClick={applyImport}>
                      Replace my notebook
                    </Control>
                    <Control
                      type="button"
                      onClick={() => {
                        setPendingImport(null);
                        setNotebookMessage("Import cancelled.");
                      }}
                    >
                      Cancel import
                    </Control>
                  </Controls>
                </div>
              )}
            </NotebookDialog>
            <Workspace>
              <Sidebar aria-label="Hallway navigation">
                {blankMode ? (
                  <MapPanel $open>
                    <h2>Your sections</h2>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <p key={n}>
                        <a
                          href={`#blank-section-${n}`}
                          style={{ color: "inherit" }}
                        >
                          {n === 6 ? "End section" : `Section ${n}`}
                        </a>
                      </p>
                    ))}
                  </MapPanel>
                ) : (
                  <>
                    <MobileSummary>
                      <span>
                        {current.floor === 0
                          ? "Primer Floor"
                          : `Floor ${current.floor}/16`}{" "}
                        · <strong>{anomalyTotal}</strong> marked ·{" "}
                        <strong>{revisitTotal}</strong> revisit
                        {canFlag && (
                          <span style={{ display: "block" }}>
                            {checkedCount} of {blankMode ? "your " : ""}
                            {spotIds.length}{" "}
                            {blankMode ? "recorded spaces" : "spaces"} checked
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        aria-expanded={mapOpen}
                        aria-controls="map-panel"
                        onClick={() => setMapOpen((value) => !value)}
                      >
                        {mapOpen ? "Close map" : "Open map"}
                      </button>
                    </MobileSummary>
                    <MapPanel id="map-panel" $open={mapOpen}>
                      <HallwayOverview
                        flags={current.flags}
                        references={current.references}
                        checking={canFlag}
                        floor={current.floor}
                        total={anomalyTotal}
                        revisit={revisitTotal}
                        onJump={() => setMapOpen(false)}
                      />
                    </MapPanel>
                  </>
                )}
              </Sidebar>
              <DetailColumn>
                <HallwayStack>
                  {blankMode ? (
                    <BlankHallway
                      wing={current}
                      onUpdate={updateWing}
                      renderSpot={renderSpot}
                      editing={current.floor === 0 || referenceView}
                    />
                  ) : (
                    <>
                      {[1, 2, 3, 4, 5].map((number) => (
                        <HallwaySection
                          key={number}
                          sectionNumber={number}
                          progressText={
                            canFlag
                              ? `${allSpotIds().filter((id) => id.startsWith(`s${number}-`) && spaceChecked(current.references[id], current.flags, id)).length}/4 spaces checked`
                              : null
                          }
                          renderSpot={renderSpot}
                        />
                      ))}
                      <SectionFrame aria-labelledby="end-section">
                        <SectionHeading>
                          <h2 id="end-section">End section</h2>
                          <span>
                            Corner
                            {canFlag && (
                              <small style={{ display: "block" }}>
                                {spaceChecked(
                                  current.references["end-corner"],
                                  current.flags,
                                  "end-corner",
                                )
                                  ? "1/1 space checked"
                                  : "0/1 space checked"}
                              </small>
                            )}
                          </span>
                        </SectionHeading>
                        <CornerSpace>
                          {renderSpot("end-corner", "End of hallway, corner")}
                        </CornerSpace>
                      </SectionFrame>
                      {(current.customSpots ?? []).length > 0 && (
                        <BlankHallway
                          wing={current}
                          onUpdate={updateWing}
                          renderSpot={renderSpot}
                          editing={current.floor === 0 || referenceView}
                          customOnly
                        />
                      )}
                    </>
                  )}
                </HallwayStack>
                <Total>
                  {current.floor === 0
                    ? "Primer Floor"
                    : `Floor ${current.floor}`}{" "}
                  · Anomalies marked: <strong>{anomalyTotal}</strong> · Items to
                  revisit: <strong>{revisitTotal}</strong>
                </Total>
                <Status>
                  Each different item counts once. Unsure items stay separate
                  until you decide.
                </Status>
                {canFlag && (
                  <Status role="status">
                    {checkedCount} of {blankMode ? "your " : ""}
                    {spotIds.length} {blankMode ? "recorded spaces" : "spaces"}{" "}
                    checked.{" "}
                    {unchecked.length > 0
                      ? `${unchecked.length} still need checking. `
                      : ""}
                    {revisitTotal > 0
                      ? `${revisitTotal} items marked Not sure still need a decision.`
                      : ""}
                  </Status>
                )}
                <Controls>
                  {current.complete ? (
                    <Control type="button" onClick={() => advance(false)}>
                      Start another run
                    </Control>
                  ) : referenceView ? (
                    <Control
                      type="button"
                      onClick={() => setReferenceView(false)}
                    >
                      Return to current floor
                    </Control>
                  ) : (
                    <>
                      <Control
                        type="button"
                        $primary
                        onClick={() => advance(true)}
                      >
                        {current.floor === 0
                          ? current.retryFloor
                            ? `Retry floor ${current.retryFloor}`
                            : "Finish reference · Go to floor 1"
                          : current.floor === 16
                            ? "Pass · Complete wing"
                            : "Pass · Next floor"}
                      </Control>
                      {current.floor > 0 && (
                        <Control type="button" onClick={() => advance(false)}>
                          Fail · Return to Primer Floor
                        </Control>
                      )}
                    </>
                  )}
                </Controls>
                <Status aria-live="polite">{announcement}</Status>
              </DetailColumn>
            </Workspace>
          </>
        )}
        <Footer>
          <FooterActions>
            <FooterLink
              $primary
              href="https://store.steampowered.com/app/3855530/Turning_Manor/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore Turning Manor on Steam
            </FooterLink>
            <FooterLink
              href="https://rockagoth.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Enter Rockagoth’s Basement
            </FooterLink>
          </FooterActions>
          <p>Unofficial companion · Created by Rockagoth</p>
        </Footer>
        <NotebookDialog
          ref={spoilerDialog}
          aria-labelledby="spoiler-heading"
          aria-describedby="spoiler-description"
          onClose={() => {
            setPendingWing(null);
            spoilerTrigger.current?.focus();
          }}
        >
          <h2 id="spoiler-heading">Entering a new wing?</h2>
          <p id="spoiler-description">
            This tracker reveals the wing’s setting, layout, and object
            categories. For the best experience, enter this wing in the game
            first.
          </p>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minHeight: 44,
            }}
          >
            <input
              type="checkbox"
              checked={rememberWing}
              onChange={(event) => setRememberWing(event.target.checked)}
            />
            Don’t show this again for this wing.
          </label>
          <Controls>
            <Control type="button" $primary onClick={openPendingWing}>
              Open wing
            </Control>
            <Control
              type="button"
              autoFocus
              onClick={() => spoilerDialog.current?.close()}
            >
              Go back
            </Control>
          </Controls>
        </NotebookDialog>
      </Page>
    </>
  );
}
