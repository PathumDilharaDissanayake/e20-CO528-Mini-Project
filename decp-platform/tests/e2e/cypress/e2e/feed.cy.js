describe('Feed Features', () => {
  beforeEach(() => {
    cy.login('student@test.com', 'Password123!');
    cy.visit('/feed');
  });

  it('should display feed page', () => {
    cy.get('[data-testid=feed-page]').should('be.visible');
    cy.get('[data-testid=create-post-button]').should('be.visible');
  });

  it('should create a new text post', () => {
    const postContent = 'This is a test post ' + Date.now();
    
    cy.get('[data-testid=create-post-button]').click();
    cy.get('[data-testid=post-content-input]').type(postContent);
    cy.get('[data-testid=submit-post-button]').click();
    
    cy.get('[data-testid=post-card]').first().should('contain', postContent);
  });

  it('should like a post', () => {
    cy.get('[data-testid=like-button]').first().click();
    cy.get('[data-testid=like-button]').first().should('have.class', 'liked');
  });

  it('should comment on a post', () => {
    const comment = 'This is a test comment ' + Date.now();
    
    cy.get('[data-testid=comment-button]').first().click();
    cy.get('[data-testid=comment-input]').type(comment);
    cy.get('[data-testid=submit-comment-button]').click();
    
    cy.get('[data-testid=comment-text]').should('contain', comment);
  });

  it('should share a post', () => {
    cy.get('[data-testid=share-button]').first().click();
    cy.get('[data-testid=share-modal]').should('be.visible');
    cy.get('[data-testid=confirm-share-button]').click();
    
    cy.get('[data-testid=toast-success]').should('contain', 'Post shared');
  });

  it('should load more posts on scroll', () => {
    cy.get('[data-testid=post-card]').should('have.length.at.least', 5);
    cy.scrollTo('bottom');
    cy.get('[data-testid=loading-spinner]').should('be.visible');
    cy.get('[data-testid=post-card]').should('have.length.at.least', 10);
  });

  it('should navigate to post detail', () => {
    cy.get('[data-testid=post-card]').first().click();
    cy.url().should('include', '/post/');
    cy.get('[data-testid=post-detail]').should('be.visible');
  });
});
