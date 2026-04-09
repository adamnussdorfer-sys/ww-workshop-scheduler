import { useRef, useState, useCallback } from 'react';
import { parseISO, differenceInMinutes, addMinutes } from 'date-fns';
import { PX_PER_MIN, GRID_HEIGHT, GRID_START_HOUR } from '../utils/availabilityBands';
import { createDateInTz } from '../utils/timezone';

const DRAG_THRESHOLD = 5; // px before drag activates
const SNAP_MINUTES = 15;

const initial = { active: false, workshopId: null };

export default function useDrag({ workshops, setWorkshops, userTimezone, toast, dayColumns }) {
  const [dragState, setDragState] = useState(initial);
  const didDrag = useRef(false);
  const ref = useRef({
    ws: null,
    startY: 0,
    startX: 0,
    originTop: 0,
    originDay: null,
    durationMin: 0,
    scrollEl: null,
    scrollStartTop: 0,
    activated: false,
  });

  const onPointerDown = useCallback((e, workshop, scrollContainer, day) => {
    if (e.button !== 0) return; // left click only
    if (workshop.status === 'Cancelled') return;

    const start = parseISO(workshop.startTime);
    const end = parseISO(workshop.endTime);
    const durationMin = differenceInMinutes(end, start);
    const scrollTop = scrollContainer?.scrollTop ?? 0;

    ref.current = {
      ws: workshop,
      startY: e.clientY,
      startX: e.clientX,
      originTop: e.clientY + scrollTop,
      originDay: day,
      durationMin,
      scrollEl: scrollContainer,
      scrollStartTop: scrollTop,
      activated: false,
    };

    didDrag.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    const r = ref.current;
    if (!r.ws) return;

    const dx = e.clientX - r.startX;
    const dy = e.clientY - r.startY;

    if (!r.activated) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      r.activated = true;
      didDrag.current = true;
      setDragState({ active: true, workshopId: r.ws.id });
    }

    const scrollTop = r.scrollEl?.scrollTop ?? 0;
    const rawY = e.clientY + scrollTop - (r.scrollEl?.getBoundingClientRect().top ?? 0) - 8; // 8px = pt-2 padding
    const snappedMinutes = Math.round(rawY / PX_PER_MIN / SNAP_MINUTES) * SNAP_MINUTES;
    const clampedMinutes = Math.max(0, Math.min(snappedMinutes, (24 * 60) - r.durationMin));
    const newTop = clampedMinutes * PX_PER_MIN;

    // Determine target day column from horizontal position
    let targetDay = r.originDay;
    if (dayColumns?.current) {
      const cols = dayColumns.current;
      for (let i = 0; i < cols.length; i++) {
        if (!cols[i]) continue;
        const rect = cols[i].getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX < rect.right) {
          targetDay = cols[i].__day;
          break;
        }
      }
    }

    ref.current.currentTop = newTop;
    ref.current.currentDay = targetDay;
    ref.current.currentMinutes = clampedMinutes;

    setDragState({
      active: true,
      workshopId: r.ws.id,
      top: newTop,
      height: r.durationMin * PX_PER_MIN - 6,
      targetDay,
    });
  }, [dayColumns]);

  const onPointerUp = useCallback((e) => {
    const r = ref.current;
    if (!r.ws) return;

    if (r.activated) {
      e.stopPropagation();
      e.preventDefault();

      const mins = r.currentMinutes;
      const newHour = GRID_START_HOUR + Math.floor(mins / 60);
      const newMinute = mins % 60;
      const targetDay = r.currentDay;

      const newStart = createDateInTz(targetDay, newHour, newMinute, userTimezone);
      const newEnd = addMinutes(newStart, r.durationMin);

      const wsId = r.ws.id;
      setWorkshops((prev) =>
        prev.map((w) =>
          w.id === wsId
            ? { ...w, startTime: newStart.toISOString(), endTime: newEnd.toISOString() }
            : w
        )
      );

      const dayLabel = targetDay.toLocaleDateString('en-US', { weekday: 'short' });
      const timeLabel = newStart.toLocaleTimeString('en-US', {
        timeZone: userTimezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      toast?.(`Workshop moved to ${dayLabel} ${timeLabel}`);
    }

    ref.current = { ...ref.current, ws: null, activated: false };
    setDragState(initial);
  }, [setWorkshops, userTimezone, toast]);

  const cancelDrag = useCallback(() => {
    ref.current = { ...ref.current, ws: null, activated: false };
    setDragState(initial);
  }, []);

  return { dragState, didDrag, onPointerDown, onPointerMove, onPointerUp, cancelDrag };
}
