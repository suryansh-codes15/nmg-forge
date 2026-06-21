import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

const TAG_COLORS = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];

export default function CardModal({ card, members, allTags, onClose, onUpdate, onDelete, onAttachTag, onDetachTag, onAssign, onUnassign }) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(card.due_date ? card.due_date.slice(0, 10) : "");
  const [activities, setActivities] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commenterId, setCommenterId] = useState("");

  const cardTagIds = new Set((card.tags || []).map((t) => t.id));
  const cardMemberIds = new Set((card.members || []).map((m) => m.id));
  const selectedCommenterId = commenterId || members[0]?.id?.toString() || "";

  const loadActivities = useCallback(async () => {
    try {
      const data = await api.getActivities(card.id);
      setActivities(data);
    } catch (e) {
      console.error("Failed to load activities", e);
    }
  }, [card.id]);

  useEffect(() => {
    let cancelled = false;

    api.getActivities(card.id)
      .then((data) => {
        if (!cancelled) setActivities(data);
      })
      .catch((e) => {
        console.error("Failed to load activities", e);
      });

    return () => {
      cancelled = true;
    };
  }, [card.id, card.members, card.tags, card.title, card.description, card.due_date]);

  function save() {
    onUpdate(card.id, { title, description, due_date: dueDate || null });
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!selectedCommenterId || !newComment.trim()) return;
    try {
      await api.postComment(card.id, Number(selectedCommenterId), newComment.trim());
      setNewComment("");
      loadActivities();
    } catch (err) {
      console.error(err);
      alert("Error adding comment: " + err.message);
    }
  }

  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">x</button>

        <div className="modal-heading">
          <p className="eyebrow">Card details</p>
          <h2>{card.title}</h2>
        </div>

        <label className="field-label">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={save} />

        <label className="field-label">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} onBlur={save} rows={3} />

        <label className="field-label">Due date</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} onBlur={save} />

        <label className="field-label">Tags</label>
        <div className="tag-row">
          {allTags.map((tag) => {
            const active = cardTagIds.has(tag.id);
            return (
              <button
                key={tag.id}
                className={`tag-chip ${active ? "active" : ""}`}
                style={{ background: tag.color }}
                onClick={() => (active ? onDetachTag(card.id, tag.id) : onAttachTag(card.id, tag.id))}
              >
                {tag.name}
              </button>
            );
          })}
        </div>

        <label className="field-label">Members</label>
        <div className="member-row">
          {members.map((m) => {
            const active = cardMemberIds.has(m.id);
            return (
              <button
                key={m.id}
                className={`member-chip ${active ? "active" : ""}`}
                onClick={() => (active ? onUnassign(card.id, m.id) : onAssign(card.id, m.id))}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        <div className="modal-divider" />

        <label className="field-label compact-label">Activity & Comments</label>
        
        <form onSubmit={handleAddComment} className="comment-form">
          <div className="comment-form-row">
            <select value={selectedCommenterId} onChange={(e) => setCommenterId(e.target.value)}>
              <option value="" disabled>Select member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <input
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="comment-input"
            />
          </div>
          <button type="submit" className="comment-submit-btn" disabled={!newComment.trim() || !selectedCommenterId}>
            Comment
          </button>
        </form>

        <div className="activities-section">
          {activities.length === 0 ? (
            <div className="empty-activity">
              No comments or activity yet.
            </div>
          ) : (
            activities.map((act) => {
              const isComment = act.type === "comment";
              return (
                <div key={act.id} className={`activity-item type-${act.type}`}>
                  {isComment ? (
                    <>
                      <div className="comment-meta">
                        <span className="comment-author">{act.member ? act.member.name : "Unknown Member"}</span>
                        <span className="comment-time">{formatTime(act.created_at)}</span>
                      </div>
                      <div className="comment-text">{act.content}</div>
                    </>
                  ) : (
                    <span>
                      <strong>{act.member ? act.member.name : "System"}</strong> {act.content} <span className="activity-time">{formatTime(act.created_at)}</span>
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button className="danger-btn" onClick={() => { onDelete(card.id); onClose(); }}>
          Delete card
        </button>
      </div>
    </div>
  );
}

export { TAG_COLORS };
