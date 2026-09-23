import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { TaskListMain } from './task-list-main';

describe('TaskListMain', () => {
  let component: TaskListMain;
  let fixture: ComponentFixture<TaskListMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskListMain],
      // The view tabs are RouterLink anchors, so the router has to be present.
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListMain);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the view tabs as links to each view', () => {
    const hrefs = Array.from(
      fixture.nativeElement.querySelectorAll('app-common-tab a'),
    ).map((anchor) => (anchor as HTMLAnchorElement).getAttribute('href'));

    expect(hrefs).toEqual(['/tasks/list', '/tasks/calendar']);
  });
});
