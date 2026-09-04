import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonTab } from '../../components/common-tab/common-tab';
import { CommonButton } from '../../components/common-button/common-button';

@Component({
  selector: 'app-task-list-main',
  imports: [
    RouterOutlet,
    CommonButton,
    CommonTab,
  ],
  templateUrl: './task-list-main.html',
  styleUrl: './task-list-main.css',
})
export class TaskListMain {
  private readonly router = inject(Router);

  readonly activeView = signal<'list' | 'calendar'>('list');

  readonly viewTabs = [
    { id: 'list', label: 'List' },
    { id: 'calendar', label: 'Calendar' },
  ];

  switchView(view: string): void {
    if (view !== 'list' && view !== 'calendar') {
      return;
    }

    this.activeView.set(view);

    this.router.navigate(['/tasks', view]);
  }

  addTask(): void {
    this.router.navigate(['/tasks/create']);
  }
}
