import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonButton } from './common-button';

describe('CommonButton', () => {
  let component: CommonButton;
  let fixture: ComponentFixture<CommonButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonButton],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
