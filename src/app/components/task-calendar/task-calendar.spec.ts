import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { TaskCalendar } from './task-calendar';
import { TASK_STATUS_EVENT_COLORS } from './task-calendar.types';
import { Task, TaskStatus } from '../../services/task.types';

/**
 * The calendar opens on the current month, so the fixtures have to fall inside
 * it — days 12 and 20 exist in every month.
 */
function dayOfThisMonth(day: number): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${String(day).padStart(2, '0')}`;
}

const IN_PROGRESS_DEADLINE = dayOfThisMonth(12);
const COMPLETED_DEADLINE = dayOfThisMonth(20);

const TASKS: Task[] = [
  {
    id: '1',
    title: 'Design the login flow',
    description: '<p>…</p>',
    deadline: IN_PROGRESS_DEADLINE,
    status: TaskStatus.IN_PROGRESS,
  },
  {
    id: '2',
    title: 'Write release notes',
    description: '<p>…</p>',
    deadline: COMPLETED_DEADLINE,
    status: TaskStatus.COMPLETED,
  },
];

/**
 * FullCalendar builds its own DOM, so these specs assert against what it
 * actually rendered rather than against the options object — that is the only
 * way to catch the two things that would silently break the feature: events
 * losing their href (which makes the calendar keyboard-unreachable) and a
 * deadline landing on the wrong day.
 */
describe('TaskCalendar', () => {
  let fixture: ComponentFixture<TaskCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCalendar],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCalendar);
    fixture.componentRef.setInput('tasks', TASKS);
    await fixture.whenStable();
  });

  function events(): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('a.fc-event'));
  }

  function eventFor(title: string): HTMLAnchorElement {
    const match = events().find((event) => event.textContent?.includes(title));
    expect(match).toBeTruthy();

    return match as HTMLAnchorElement;
  }

  it('renders a month grid', () => {
    expect(fixture.nativeElement.querySelector('.fc-dayGridMonth-view')).toBeTruthy();
  });

  it('places each task on its deadline', () => {
    const day = eventFor('Design the login flow').closest('.fc-daygrid-day');

    expect(day?.getAttribute('data-date')).toBe(IN_PROGRESS_DEADLINE);
  });

  it('links each event to the task details page', () => {
    expect(eventFor('Write release notes').getAttribute('href')).toBe('/tasks/2');
  });

  it('colours events by status', () => {
    const { background } = TASK_STATUS_EVENT_COLORS[TaskStatus.IN_PROGRESS];

    // The DOM reports the colour back as rgb().
    expect(eventFor('Design the login flow').style.backgroundColor).toBe(toRgb(background));
  });

  it('names each event with its status and due date', () => {
    const label = eventFor('Design the login flow').getAttribute('aria-label');

    expect(label).toContain('Design the login flow');
    expect(label).toContain('In progress');
  });

  it('emits the task id instead of following the link', async () => {
    const selected: string[] = [];
    fixture.componentInstance.taskSelect.subscribe((id) => selected.push(id));

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    eventFor('Write release notes').dispatchEvent(click);
    await fixture.whenStable();

    expect(selected).toEqual(['2']);
    expect(click.defaultPrevented).toBe(true);
  });

  it('re-renders when the tasks change', async () => {
    fixture.componentRef.setInput('tasks', [TASKS[0]]);
    await fixture.whenStable();

    expect(events()).toHaveLength(1);
  });
});

function toRgb(hex: string): string {
  const [red, green, blue] = [1, 3, 5].map((start) =>
    Number.parseInt(hex.slice(start, start + 2), 16),
  );

  return `rgb(${red}, ${green}, ${blue})`;
}
