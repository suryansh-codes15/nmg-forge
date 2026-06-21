import { useEffect, useState, useCallback } from "react";
import { api } from "./api";
import CardModal from "./CardModal";

function isOverdue(card) {
  if (!card.due_date) return false;
  const due = new Date(card.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function App() {
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [tags, setTags] = useState([]);
  const [openCard, setOpenCard] = useState(null);
  const [error, setError] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [newCardTitle, setNewCardTitle] = useState({});

  const loadBoard = useCallback(async (boardId) => {
    try {
      const board = await api.getBoard(boardId);
      setActiveBoard(board);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [b, m, t] = await Promise.all([api.getBoards(), api.getMembers(), api.getTags()]);
        setBoards(b);
        setMembers(m);
        setTags(t);
        if (b.length) loadBoard(b[0].id);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [loadBoard]);

  async function createBoard() {
    const name = prompt("Board name?");
    if (!name) return;
    const board = await api.createBoard({ name });
    setBoards((prev) => [...prev, board]);
    loadBoard(board.id);
  }

  async function addList() {
    if (!newListName.trim() || !activeBoard) return;
    await api.createList(activeBoard.id, { name: newListName.trim() });
    setNewListName("");
    loadBoard(activeBoard.id);
  }

  async function addCard(listId) {
    const title = (newCardTitle[listId] || "").trim();
    if (!title) return;
    await api.createCard(listId, { title });
    setNewCardTitle((prev) => ({ ...prev, [listId]: "" }));
    loadBoard(activeBoard.id);
  }

  async function moveCard(cardId, toListId) {
    await api.moveCard(cardId, toListId);
    loadBoard(activeBoard.id);
  }

  async function updateCard(cardId, data) {
    await api.updateCard(cardId, data);
    loadBoard(activeBoard.id);
  }

  async function deleteCard(cardId) {
    await api.deleteCard(cardId);
    loadBoard(activeBoard.id);
  }

  async function attachTag(cardId, tagId) {
    await api.attachTag(cardId, tagId);
    loadBoard(activeBoard.id);
  }

  async function detachTag(cardId, tagId) {
    await api.detachTag(cardId, tagId);
    loadBoard(activeBoard.id);
  }

  async function assignMember(cardId, memberId) {
    await api.assignMember(cardId, memberId);
    loadBoard(activeBoard.id);
  }

  async function unassignMember(cardId, memberId) {
    await api.unassignMember(cardId, memberId);
    loadBoard(activeBoard.id);
  }

  function onDragStart(e, cardId) {
    e.dataTransfer.setData("cardId", cardId);
  }

  function onDrop(e, listId) {
    const cardId = e.dataTransfer.getData("cardId");
    if (cardId) moveCard(Number(cardId), listId);
  }

  const allCards = activeBoard?.lists.flatMap((list) => list.cards) || [];
  const overdueCount = allCards.filter(isOverdue).length;
  const assignedCount = allCards.filter((card) => card.members?.length > 0).length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">N</div>
          <div>
            <p className="eyebrow">NMG Forge</p>
            <h1>{activeBoard?.name || "Project board"}</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="board-tabs" aria-label="Boards">
            {boards.map((b) => (
              <button
                key={b.id}
                className={`board-tab ${activeBoard?.id === b.id ? "active" : ""}`}
                onClick={() => loadBoard(b.id)}
              >
                {b.name}
              </button>
            ))}
          </div>
          <button className="board-create-btn" onClick={createBoard}>New board</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {activeBoard && (
        <>
          <section className="board-summary" aria-label="Board summary">
            <div>
              <span>{activeBoard.lists.length}</span>
              <p>Lists</p>
            </div>
            <div>
              <span>{allCards.length}</span>
              <p>Cards</p>
            </div>
            <div>
              <span>{assignedCount}</span>
              <p>Assigned</p>
            </div>
            <div className={overdueCount > 0 ? "summary-alert" : ""}>
              <span>{overdueCount}</span>
              <p>Overdue</p>
            </div>
          </section>

          <main className="board">
            {activeBoard.lists.map((list) => (
              <section
                key={list.id}
                className="list"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, list.id)}
              >
                <div className="list-header">
                  <h2>{list.name}</h2>
                  <span>{list.cards.length}</span>
                </div>
                <div className="cards">
                  {list.cards.length === 0 && (
                    <div className="empty-list">Drop a card here or create the first task.</div>
                  )}
                  {list.cards.map((card) => (
                    <article
                      key={card.id}
                      className={`card ${isOverdue(card) ? "overdue" : ""}`}
                      draggable
                      onDragStart={(e) => onDragStart(e, card.id)}
                      onClick={() => setOpenCard(card)}
                    >
                      {card.tags?.length > 0 && (
                        <div className="card-tags" aria-label="Tags">
                          {card.tags.map((t) => (
                            <span key={t.id} className="mini-tag" style={{ background: t.color }} title={t.name} />
                          ))}
                        </div>
                      )}
                      <div className="card-title">{card.title}</div>
                      <div className="card-footer">
                        {card.due_date ? (
                          <span className={`card-due ${isOverdue(card) ? "overdue-text" : ""}`}>
                            {card.due_date.slice(0, 10)}
                          </span>
                        ) : (
                          <span className="card-due muted">No due date</span>
                        )}
                        {card.members?.length > 0 && (
                          <div className="card-members" aria-label="Assigned members">
                            {card.members.slice(0, 3).map((m) => (
                              <span key={m.id} className="member-avatar" title={m.name}>
                                {getInitials(m.name)}
                              </span>
                            ))}
                            {card.members.length > 3 && <span className="member-more">+{card.members.length - 3}</span>}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                <div className="add-card-row">
                  <input
                    placeholder="New card..."
                    value={newCardTitle[list.id] || ""}
                    onChange={(e) => setNewCardTitle((p) => ({ ...p, [list.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addCard(list.id)}
                  />
                  <button onClick={() => addCard(list.id)}>Add</button>
                </div>
              </section>
            ))}

            <section className="list new-list">
              <div className="list-header">
                <h2>Add list</h2>
              </div>
              <input
                placeholder="List name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addList()}
              />
              <button onClick={addList}>Create list</button>
            </section>
          </main>
        </>
      )}

      {!activeBoard && !error && (
        <main className="empty-board">
          <div className="empty-board-panel">
            <p className="eyebrow">No boards yet</p>
            <h2>Create a board to start planning.</h2>
            <button onClick={createBoard}>New board</button>
          </div>
        </main>
      )}

      {openCard && (
        <CardModal
          card={activeBoard?.lists.flatMap((l) => l.cards).find((c) => c.id === openCard.id) || openCard}
          members={members}
          allTags={tags}
          onClose={() => setOpenCard(null)}
          onUpdate={updateCard}
          onDelete={deleteCard}
          onAttachTag={attachTag}
          onDetachTag={detachTag}
          onAssign={assignMember}
          onUnassign={unassignMember}
        />
      )}
    </div>
  );
}
