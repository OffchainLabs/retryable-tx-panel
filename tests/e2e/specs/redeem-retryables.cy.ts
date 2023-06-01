import { addDefaultLocalNetwork } from '@arbitrum/sdk';
import { L1ToL2MessageCreator } from '@arbitrum/sdk/dist/lib/message/L1ToL2MessageCreator';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { BigNumber, Wallet } from 'ethers';

const createRetryable = async () => {
  try {
    addDefaultLocalNetwork();
  } catch (e) {}
  const ethProvider = new StaticJsonRpcProvider(Cypress.env('ETH_RPC_URL'));
  const arbProvider = new StaticJsonRpcProvider(Cypress.env('ARB_RPC_URL'));
  const privateKey = Cypress.env('PRIVATE_KEY');
  const userWallet = new Wallet(privateKey);

  const l1Signer = userWallet.connect(ethProvider);
  const signerAddress = await l1Signer.getAddress();

  // Instantiate the object
  const l1ToL2MessageCreator = new L1ToL2MessageCreator(l1Signer);

  // And create the retryable ticket
  const l1SubmissionTx = await l1ToL2MessageCreator.createRetryableTicket(
    {
      from: signerAddress,
      l2CallValue: BigNumber.from(0),
      to: signerAddress,
      data: '0x',
      retryableData: {
        data: '0x',
        from: signerAddress,
        l2CallValue: BigNumber.from(0),
        to: signerAddress,
        deposit: BigNumber.from(0),
        maxFeePerGas: BigNumber.from(10),
        gasLimit: BigNumber.from(10),
        maxSubmissionCost: BigNumber.from(10),
        callValueRefundAddress: signerAddress,
        excessFeeRefundAddress: signerAddress,
      },
    },
    arbProvider,
  );
  const l1SubmissionTxReceipt = await l1SubmissionTx.wait();
  return l1SubmissionTxReceipt;
};

function goToTransactionPage(transactionHash: string) {
  cy.findByText('Arbitrum Cross-chain Message Dashboard').click();
  cy.findByPlaceholderText('Paste your transaction hash')
    .should('exist')
    .type(transactionHash);
  return cy.findByDisplayValue('Submit').click();
}

describe('Retryable', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it("Display retryable information before it's claimed", async () => {
    const retryable = await createRetryable();
    goToTransactionPage(retryable.transactionHash);
    cy.findByDisplayValue('Submit').click();

    cy.findByText('Cross chain messages found').should('exist');
    cy.findByText(
      'L1 to L2 message initiated from L1, but not yet created — check again in a few minutes!',
    ).should('exist');
    cy.findByText('Redeem').should('not.exist');
    cy.findByText('Connect').should('not.exist');
  });

  it('Display expired retryable', () => {
    goToTransactionPage(
      '0xd5114540abaf1442b5bf2b1f31a4e49d333bb585bb39e87d99b2667b9e25c1f3',
    );
    cy.findByText('Cross chain messages found').should('exist');
    cy.findByText('Retryable ticket expired.').should('exist');
    cy.findByText('Redeem').should('not.exist');
    cy.findByText('Connect').should('not.exist');
  });

  it('Display successful retryable information', () => {
    goToTransactionPage(
      '0xe07401ee4ba9131f6efe367eaace256a59daaf162a53e2e105caa810228487c8',
    );
    cy.findByText('Cross chain messages found').should('exist');
    cy.findByText('Success! 🎉 Your retryable was executed.').should('exist');
    cy.findByText('Redeem').should('not.exist');
    cy.findByText('Connect').should('not.exist');
  });
});
