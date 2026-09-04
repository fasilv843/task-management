import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonBackButton } from './common-back-button';

describe('CommonBackButton', () => {
  let component: CommonBackButton;
  let fixture: ComponentFixture<CommonBackButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonBackButton],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonBackButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
