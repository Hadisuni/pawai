'use client';

import type { CinemaStory } from '@/lib/demoCinema';

export default function StoryPicker({
  stories,
  activeId,
  onSelect,
}: {
  stories: CinemaStory[];
  activeId: CinemaStory['id'];
  onSelect: (id: CinemaStory['id']) => void;
}) {
  return (
    <div className="cinema-tabs" role="tablist" aria-label="Demo stories">
      {stories.map((s) => {
        const selected = s.id === activeId;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`cinema-tab${selected ? ' is-active' : ''}`}
            onClick={() => onSelect(s.id)}
          >
            <span className="cinema-tab__icon" aria-hidden="true">{s.icon}</span>
            <span className="cinema-tab__name">{s.petName}</span>
            <span className="cinema-tab__sub">{s.title}</span>
          </button>
        );
      })}
    </div>
  );
}
