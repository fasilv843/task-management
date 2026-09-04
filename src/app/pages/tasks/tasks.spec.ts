import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Tasks } from './tasks';

describe('Tasks', () => {
  let component: Tasks;
  let fixture: ComponentFixture<Tasks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tasks],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Tasks);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // The task list resource fetches on init; stability is only reachable once
    // that request has been answered.
    TestBed.inject(HttpTestingController).expectOne('assets/tasks.json').flush([]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
