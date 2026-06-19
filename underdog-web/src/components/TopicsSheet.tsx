import { useState, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useApp } from '../store';
import { TOPICS } from '../seed';
import { TOPIC_ICONS, IoClose, IoAddOutline, IoCheckmarkCircle, IoReorderThreeOutline } from '../icons';

function SortableTopic({ id, onRemove, onRename }: { id: string; onRemove: () => void; onRename: (oldId: string, newId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const topic = TOPICS.find((t) => t.id === id);
  const Icon = topic ? TOPIC_ICONS[topic.id] : null;
  const label = topic ? topic.label : id;
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(id);
  const inputRef = useRef<HTMLInputElement>(null);

  const save = () => {
    const v = editVal.trim().toLowerCase();
    if (v && v !== id) onRename(id, v);
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="sortable-topic">
      <button className="drag-handle" {...attributes} {...listeners}><IoReorderThreeOutline size={18} color="var(--faint)" /></button>
      {Icon && <Icon size={16} color="var(--brand)" />}
      {editing ? (
        <div className="sortable-topic-edit">
          <input ref={inputRef} className="custom-chip-edit-input" value={editVal} maxLength={40}
            onChange={(e) => setEditVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            onBlur={save} />
          <button className="chip-submit-btn" onClick={save}><IoCheckmarkCircle size={18} color="var(--brand)" /></button>
        </div>
      ) : (
        <span className="sortable-topic-label" onClick={() => { setEditing(true); setEditVal(id); setTimeout(() => inputRef.current?.focus(), 50); }}>{label}</span>
      )}
      <button className="topic-remove" onClick={onRemove}><IoClose size={16} color="var(--faint)" /></button>
    </div>
  );
}

export function TopicsSheet({ onClose }: { onClose: () => void }) {
  const { prefs, topicOrder, addTopic, removeTopic, reorderTopics, renameTopic } = useApp();
  const [input, setInput] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeOrdered = topicOrder.filter((t) => (prefs.interests[t] ?? 0) > 0);
  const inactiveCategories = TOPICS.filter((t) => (prefs.interests[t.id] ?? 0) === 0);

  const add = () => {
    const t = input.trim().toLowerCase();
    if (t) addTopic(t);
    setInput('');
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = activeOrdered.indexOf(active.id as string);
    const newIdx = activeOrdered.indexOf(over.id as string);
    if (oldIdx < 0 || newIdx < 0) return;
    reorderTopics(arrayMove(activeOrdered, oldIdx, newIdx));
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, maxHeight: '85%' }}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <span className="sheet-title">Your topics</span>
          <button onClick={onClose} className="icon-btn"><IoClose size={22} /></button>
        </div>

        {/* Draggable priority list */}
        {activeOrdered.length > 0 && (
          <div className="topic-section">
            <div className="topic-section-label">Drag to reorder priority</div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={activeOrdered} strategy={verticalListSortingStrategy}>
                {activeOrdered.map((t) => (
                  <SortableTopic key={t} id={t} onRemove={() => removeTopic(t)} onRename={renameTopic} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Add new topic */}
        <div className="topic-add-row">
          <input className="custom-topic-input" placeholder="Add a topic (e.g. SpaceX, AI art…)"
            value={input} maxLength={40} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
          <button className="custom-topic-add" onClick={add} disabled={!input.trim()}><IoAddOutline size={18} /></button>
        </div>

        {/* Inactive categories (tap to add) */}
        {inactiveCategories.length > 0 && (
          <div className="topic-section">
            <div className="topic-section-label">More categories</div>
            <div className="topic-chips">
              {inactiveCategories.map((t) => {
                const Icon = TOPIC_ICONS[t.id];
                return (
                  <button key={t.id} className="topic-chip" onClick={() => addTopic(t.id)}>
                    <Icon size={14} color="var(--faint)" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="topic-hint">Drag topics to set priority. Higher topics influence your feed more. Adding or removing refreshes in real time.</p>
      </div>
    </div>
  );
}
