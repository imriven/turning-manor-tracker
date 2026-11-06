import { useState } from "react";
import styled from "styled-components";
const TYPES = ["Plant", "Painting", "Shelf", "Empty"];
const Spot = styled.div`
  min-width: 0;
  padding: 12px;
  border: 1px solid #64553e;
  border-radius: 4px;
  background: #a5b797;
  color: #263321;
  border: 3px ridge #b49360;
  box-shadow:
    0 5px 12px #0007,
    inset 0 1px 0 #ffffff66;
`;
const Button = styled.button`
  padding: 10px 12px;
  border: 1px solid ${({ $selected }) => ($selected ? "#d4b477" : "#806b47")};
  border-radius: 4px;
  background: ${({ $selected }) => ($selected ? "#550000" : "#30231c")};
  color: #eee2ce;
  cursor: pointer;
  font-size: 0.8rem;
  &:hover:not(:disabled) {
    border-color: #e2bd74;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
const Add = styled(Button)`
  width: 100%;
  min-height: 85px;
  border-style: dashed;
`;
const Choices = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  button {
    flex: 1 1 80px;
  }
`;
const Form = styled.form`
  display: grid;
  gap: 12px;
  fieldset {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    margin-bottom: 10px;
    color: #263321;
    font-size: 0.8rem;
    line-height: 1.5;
  }
`;
const Field = styled.label`
  display: grid;
  gap: 6px;
  color: #263321;
  font-size: 0.75rem;
  textarea {
    width: 100%;
    min-height: 70px;
    resize: vertical;
    padding: 8px;
    border: 1px solid #9b855b;
    border-radius: 3px;
    background: #e9dfc8;
    color: #35251d;
    font: inherit;
    line-height: 1.5;
  }
`;
const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;
const Item = styled.div`
  & + & {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid #514330;
  }
`;
const StatusButton = styled(Button)`
  background: ${({ $selected, $unsure }) => ($selected ? ($unsure ? "#594018" : "#550000") : "#30231c")};
  border-color: ${({ $selected, $unsure }) => ($selected ? ($unsure ? "#efbd65" : "#d4b477") : "#806b47")};
`;
function Assessment({ value, onChange, empty = false, label }) {
  return (
    <Actions role="group" aria-label={label}>
      {[
        ["same", empty ? "Still empty" : "Looks the same"],
        ["different", empty ? "Something’s here" : "Something’s different"],
        ["unsure", "Not sure · Revisit"],
      ].map(([status, text]) => (
        <StatusButton
          key={status}
          type="button"
          $selected={value === status}
          $unsure={status === "unsure"}
          aria-pressed={value === status}
          onClick={() => onChange(status)}
        >
          {text}
        </StatusButton>
      ))}
    </Actions>
  );
}
const Note = styled.p`
  padding: 8px 10px;
  border-left: 2px solid #9b855b;
  background: #e9dfc8;
  margin: 8px 0 0;
  color: #35251d;
  font-size: 0.75rem;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;
export default function ObservationSpot({
  location,
  reference,
  flags,
  onToggle,
  onSave,
  canFlag,
}) {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState({});
  function openEditor() {
    setItems(reference?.items ?? []);
    setNotes(reference?.notes ?? {});
    setEditing(true);
  }
  function toggleItem(type) {
    setItems((previous) => {
      if (type === "Empty") return previous.includes(type) ? [] : [type];
      const objects = previous.filter((x) => x !== "Empty");
      if (objects.includes(type)) return objects.filter((x) => x !== type);
      return objects.length < 2 ? [...objects, type] : objects;
    });
  }
  function save(event) {
    event.preventDefault();
    if (!items.length) return;
    onSave({
      items: [...items],
      notes: Object.fromEntries(items.map((x) => [x, notes[x] ?? ""])),
    });
    setEditing(false);
  }
  return (
    <Spot role="group" aria-label={location}>
      {editing ? (
        <Form onSubmit={save}>
          <fieldset>
            <legend>Reference: choose up to two items, or Empty.</legend>
            <Choices>
              {TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  $selected={items.includes(type)}
                  aria-pressed={items.includes(type)}
                  disabled={
                    type !== "Empty" &&
                    !items.includes(type) &&
                    items.filter((x) => x !== "Empty").length >= 2
                  }
                  onClick={() => toggleItem(type)}
                >
                  {type}
                </Button>
              ))}
            </Choices>
          </fieldset>
          {items.map((type) => (
            <Field key={type}>
              {type === "Empty" ? "Space notes" : `${type} notes`}
              <textarea
                value={notes[type] ?? ""}
                placeholder="What did you notice? (optional)"
                onChange={(event) =>
                  setNotes((previous) => ({
                    ...previous,
                    [type]: event.target.value,
                  }))
                }
              />
            </Field>
          ))}
          <Actions>
            <Button type="submit" $selected disabled={!items.length}>
              Save reference
            </Button>
            <Button type="button" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </Actions>
        </Form>
      ) : reference ? (
        <>
          {reference.items.map((type) => {
            const empty = type === "Empty";
            const itemKey = empty ? "appeared" : type;
            return (
              <Item key={type}>
                <strong>{empty ? "Reference: empty space" : type}</strong>
                <Note>
                  {reference.notes[type] || "No reference notes yet."}
                </Note>
                {canFlag && (
                  <Assessment
                    value={flags[itemKey]}
                    empty={empty}
                    label={`${location}: ${type} assessment`}
                    onChange={(status) => onToggle(itemKey, status)}
                  />
                )}
              </Item>
            );
          })}
          {canFlag && !reference.items.includes("Empty") && (
            <Item>
              <details>
                <summary>Other changes in this space</summary>
                <Note>
                  Use only for a separate change beyond the items above.
                </Note>
                <Assessment
                  value={flags.appeared}
                  label={`${location}: other changes`}
                  onChange={(status) => onToggle("appeared", status)}
                />
              </details>
            </Item>
          )}
          <Actions>
            <Button type="button" onClick={openEditor}>
              Edit reference
            </Button>
          </Actions>
        </>
      ) : (
        <Add type="button" onClick={openEditor}>
          + Add observation
        </Add>
      )}
    </Spot>
  );
}
