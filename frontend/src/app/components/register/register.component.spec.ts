import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AuthService', ['register']);
    spy.register.and.returnValue(of({ accessToken: 'token', user: { id: '1', username: 'new', email: 'n@b.com' } }));

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error when fields are empty', () => {
    component.submit();
    expect(component.error()).toBe('Please fill in all fields');
  });

  it('should show error when password is too short', () => {
    component.username = 'test';
    component.email = 'test@test.com';
    component.password = '123';
    component.submit();
    expect(component.error()).toBe('Password must be at least 6 characters');
  });
});
