import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-common-back-button',
  imports: [],
  templateUrl: './common-back-button.html',
  styleUrl: './common-back-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonBackButton {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  goBack() {
    if (history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
