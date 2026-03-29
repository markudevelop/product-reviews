import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AuthService', ['login']);
    spy.login.and.returnValue(of({ accessToken: 'token', user: { id: '1', username: 'alice', email: 'a@b.com' } }));

    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: spy }],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture = TestBed.createComponent(LoginComponent);
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

  it('should fill demo credentials', () => {
    component.fillDemo('alice@example.com');
    expect(component.email).toBe('alice@example.com');
    expect(component.password).toBe('password123');
  });

  it('should call authService.login on valid submit', () => {
    component.email = 'alice@example.com';
    component.password = 'password123';
    component.submit();
    expect(authService.login).toHaveBeenCalledWith('alice@example.com', 'password123');
  });

  it('should show error on login failure', () => {
    authService.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
    component.email = 'alice@example.com';
    component.password = 'wrong';
    component.submit();
    expect(component.error()).toBe('Invalid credentials');
  });
});
