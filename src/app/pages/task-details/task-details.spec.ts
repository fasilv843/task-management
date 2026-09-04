import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { TaskDetails } from './task-details';
import { CommentRow } from '../../services/comment.types';
import { Task, TaskStatus } from '../../services/task.types';

const seedTasks: Task[] = [
  {
    id: 1,
    title: 'Design authentication flow',
    description: '<p>Design the login flow.</p>',
    deadline: '2099-01-15',
    status: TaskStatus.IN_PROGRESS,
  },
  {
    id: 2,
    title: 'Implement task list',
    description: '<p>Build the task list page.</p>',
    deadline: '2099-02-20',
    status: TaskStatus.PENDING,
  },
];

/** Task 1 carries one unbroken four-level chain; task 2 has none. */
const seedComments: CommentRow[] = [
  {
    id: 1,
    task_id: 1,
    parent_comment_id: null,
    text: 'Level one',
    created_at: '2099-01-01T09:00:00.000Z',
  },
  {
    id: 2,
    task_id: 1,
    parent_comment_id: 1,
    text: 'Level two',
    created_at: '2099-01-01T10:00:00.000Z',
  },
  {
    id: 3,
    task_id: 1,
    parent_comment_id: 2,
    text: 'Level three',
    created_at: '2099-01-01T11:00:00.000Z',
  },
  {
    id: 4,
    task_id: 1,
    parent_comment_id: 3,
    text: 'Level four',
    created_at: '2099-01-01T12:00:00.000Z',
  },
];

describe('TaskDetails', () => {
  function configure(id: string): void {
    TestBed.configureTestingModule({
      imports: [TaskDetails],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id })) },
        },
      ],
    });
  }

  /** Creates the page and answers the two seed fetches the combined read makes. */
  async function setup(id = '1'): Promise<ComponentFixture<TaskDetails>> {
    configure(id);

    const fixture = TestBed.createComponent(TaskDetails);
    fixture.detectChanges();

    const httpTesting = TestBed.inject(HttpTestingController);
    httpTesting.expectOne('assets/tasks.json').flush(structuredClone(seedTasks));
    httpTesting.expectOne('assets/comments.json').flush(structuredClone(seedComments));

    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  }

  function text(fixture: ComponentFixture<TaskDetails>): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function threadCount(fixture: ComponentFixture<TaskDetails>): number {
    return (fixture.nativeElement as HTMLElement).querySelectorAll('app-comment-thread').length;
  }

  async function submitForm(
    fixture: ComponentFixture<TaskDetails>,
    form: HTMLFormElement,
    value: string,
  ): Promise<void> {
    const field = form.querySelector('textarea');

    if (!field) {
      throw new Error('The comment form has no textarea.');
    }

    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renders the task with its comment count', async () => {
    const fixture = await setup();

    expect(text(fixture)).toContain('Design authentication flow');
    expect(text(fixture)).toContain('Comments');
    expect(fixture.componentInstance.commentCount()).toBe(4);
  });

  it('renders every level of a nested thread', async () => {
    const fixture = await setup();

    expect(threadCount(fixture)).toBe(4);
    expect(text(fixture)).toContain('Level four');

    // One root, and the chain hanging off it rather than four siblings.
    expect(fixture.componentInstance.commentTree().length).toBe(1);
  });

  it('adds a top-level comment and clears the box', async () => {
    const fixture = await setup();
    const form = (fixture.nativeElement as HTMLElement).querySelector('form');

    expect(form).toBeTruthy();
    await submitForm(fixture, form as HTMLFormElement, 'A brand new comment');

    expect(text(fixture)).toContain('A brand new comment');
    expect(fixture.componentInstance.commentCount()).toBe(5);
    expect(threadCount(fixture)).toBe(5);
    expect((form as HTMLFormElement).querySelector('textarea')?.value).toBe('');
  });

  it('rejects a blank comment without saving it', async () => {
    const fixture = await setup();
    const form = (fixture.nativeElement as HTMLElement).querySelector('form') as HTMLFormElement;

    await submitForm(fixture, form, '   ');

    expect(fixture.componentInstance.commentCount()).toBe(4);
    expect(text(fixture)).toContain('Comment cannot be empty.');
  });

  it('nests a reply below the deepest comment, past the seeded depth', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    // Reply buttons appear in document order, so the last one is the deepest
    // node of a single chain.
    const replyButtons = host.querySelectorAll<HTMLButtonElement>('button[aria-expanded]');
    expect(replyButtons.length).toBe(4);

    replyButtons[3].click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeReplyId()).toBe(4);

    const forms = host.querySelectorAll<HTMLFormElement>('form');
    expect(forms.length).toBe(2);

    await submitForm(fixture, forms[1], 'Level five');

    expect(text(fixture)).toContain('Level five');
    expect(threadCount(fixture)).toBe(5);

    // Depth 4 is one past the deepest seeded comment — nesting is not capped.
    const added = fixture.componentInstance
      .commentTree()[0]
      .replies[0].replies[0].replies[0].replies[0];
    expect(added.text).toBe('Level five');
    expect(added.depth).toBe(4);

    // The reply box closes itself once the reply lands.
    expect(fixture.componentInstance.activeReplyId()).toBeNull();
  });

  it('shows the empty state for a task with no comments', async () => {
    const fixture = await setup('2');

    expect(text(fixture)).toContain('Implement task list');
    expect(text(fixture)).toContain('No comments yet.');
    expect(threadCount(fixture)).toBe(0);
  });

  it('shows the not-found state for an unknown id', async () => {
    configure('999');

    const fixture = TestBed.createComponent(TaskDetails);
    fixture.detectChanges();

    const httpTesting = TestBed.inject(HttpTestingController);
    httpTesting.expectOne('assets/tasks.json').flush(structuredClone(seedTasks));
    // The task is missing, so the thread is never asked for.
    httpTesting.expectNone('assets/comments.json');

    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture)).toContain("We couldn't find that task.");
  });

  it('shows the not-found state for an unparseable id without fetching', async () => {
    configure('not-a-number');

    const fixture = TestBed.createComponent(TaskDetails);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    TestBed.inject(HttpTestingController).expectNone('assets/tasks.json');
    expect(text(fixture)).toContain("We couldn't find that task.");
  });

  it('offers a retry when the task read fails', async () => {
    configure('1');

    const fixture = TestBed.createComponent(TaskDetails);
    fixture.detectChanges();

    TestBed.inject(HttpTestingController)
      .expectOne('assets/tasks.json')
      .flush('nope', { status: 500, statusText: 'Server Error' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture)).toContain("Couldn't load this task.");
    expect(text(fixture)).toContain('Retry');
  });
});
