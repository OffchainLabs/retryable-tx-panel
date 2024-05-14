import '@synthetixio/synpress/support';

Cypress.Keyboard.defaults({
  // tests are flaky in CI with low keystroke delay
  keystrokeDelay: 150,
});

before(() => {
  // connect to sepolia to avoid connecting to localhost twice and failing
  cy.setupMetamask(Cypress.env('PRIVATE_KEY'), 'sepolia');
});
