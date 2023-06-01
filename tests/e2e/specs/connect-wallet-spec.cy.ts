describe('connect wallet spec', () => {
  before(() => {
    cy.visit('/');
  });

  it('should connect wallet with success', () => {
    cy.findByText('Arbitrum Cross-chain Message Dashboard').click();
    cy.findByPlaceholderText('Paste your transaction hash')
      .should('exist')
      .type(
        '0xf5d9f782dd346ca15b457af677fcf452e63ad61bf648b336a8ccd742fc1b996b',
      );
  });
});
