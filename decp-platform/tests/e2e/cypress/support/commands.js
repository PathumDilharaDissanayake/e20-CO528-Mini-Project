// Custom commands for Cypress

Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/auth/login`,
      body: { email, password }
    }).then((response) => {
      window.localStorage.setItem('accessToken', response.body.data.tokens.accessToken);
      window.localStorage.setItem('refreshToken', response.body.data.tokens.refreshToken);
    });
  });
});

Cypress.Commands.add('logout', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/logout`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('accessToken')}`
    }
  });
  window.localStorage.clear();
});

Cypress.Commands.add('createPost', (content) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/posts`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('accessToken')}`
    },
    body: { content }
  });
});

Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid=${testId}]`);
});
