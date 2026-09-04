import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

@Component({
  selector: 'app-common-back-button',
  imports: [],
  templateUrl: './common-back-button.html',
  styleUrl: './common-back-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonBackButton {
  private readonly location = inject(Location);

  goBack() {
    this.location.back();
  }
}
