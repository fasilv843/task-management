import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskListMain } from './task-list-main';

describe('TaskListMain', () => {
  let component: TaskListMain;
  let fixture: ComponentFixture<TaskListMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskListMain],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListMain);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
