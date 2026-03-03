describe('Authentication Flows', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login with valid credentials', () => {
    cy.get('[data-testid=email-input]').type('student@test.com');
    cy.get('[data-testid=password-input]').type('Password123!');
    cy.get('[data-testid=login-button]').click();
    
    cy.url().should('include', '/feed');
    cy.get('[data-testid=feed-page]').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('[data-testid=email-input]').type('wrong@test.com');
    cy.get('[data-testid=password-input]').type('wrongpassword');
    cy.get('[data-testid=login-button]').click();
    
    cy.get('[data-testid=error-message]').should('contain', 'Invalid credentials');
  });

  it('should navigate to register page', () => {
    cy.get('[data-testid=register-link]').click();
    cy.url().should('include', '/register');
  });

  it('should register a new user', () => {
    cy.visit('/register');
    
    cy.get('[data-testid=firstName-input]').type('John');
    cy.get('[data-testid=lastName-input]').type('Doe');
    cy.get('[data-testid=email-input]').type('newuser@test.com');
    cy.get('[data-testid=password-input]').type('Password123!');
    cy.get('[data-testid=confirmPassword-input]').type('Password123!');
    cy.get('[data-testid=role-select]').click();
    cy.get('[data-testid=role-student]').click();
    cy.get('[data-testid=register-button]').click();
    
    cy.url().should('include', '/verify-email');
  });

  it('should logout successfully', () => {
    // Login first
    cy.login('student@test.com', 'Password123!');
    
    // Logout
    cy.get('[data-testid=user-menu]').click();
    cy.get('[data-testid=logout-button]').click();
    
    cy.url().should('include', '/login');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('[data-testid=login-button]').click();
    
    cy.get('[data-testid=email-error]').should('contain', 'Email is required');
    cy.get('[data-testid=password-error]').should('contain', 'Password is required');
  });
});

describe('Protected Routes', () => {
  it('should redirect unauthenticated users to login', () => {
    cy.visit('/feed');
    cy.url().should('include', '/login');
  });

  it('should allow access to protected routes when authenticated', () => {
    cy.login('student@test.com', 'Password123!');
    cy.visit('/feed');
    cy.url().should('include', '/feed');
  });
});
