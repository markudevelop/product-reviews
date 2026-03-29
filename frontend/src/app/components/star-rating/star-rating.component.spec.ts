import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';

describe('StarRatingComponent', () => {
  let component: StarRatingComponent;
  let fixture: ComponentFixture<StarRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct rating', () => {
    component.rating = 3.5;
    fixture.detectChanges();
    expect(component.displayRating).toBe(3.5);
  });

  it('should handle interactive selection', () => {
    component.interactive = true;
    component.onSelect(4);
    expect(component.selectedRating).toBe(4);
  });

  it('should show hover rating when interactive', () => {
    component.interactive = true;
    component.onHover(3);
    expect(component.hoverRating).toBe(3);
    expect(component.displayRating).toBe(3);
  });

  it('should reset hover on leave', () => {
    component.interactive = true;
    component.selectedRating = 4;
    component.onHover(2);
    component.onLeave();
    expect(component.hoverRating).toBe(0);
    expect(component.displayRating).toBe(4);
  });
});
