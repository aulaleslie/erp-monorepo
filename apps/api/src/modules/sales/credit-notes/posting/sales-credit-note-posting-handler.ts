import { DefaultPostingHandler } from '../../../documents/posting/default-posting-handler';
import { PostingContext } from '../../../documents/posting/posting-handler.interface';
import { MembershipsIntegrationService } from '../../../memberships/memberships-integration.service';
import { PtSessionPackagesIntegrationService } from '../../../pt-session-packages/pt-session-packages-integration.service';

export class SalesCreditNotePostingHandler extends DefaultPostingHandler {
  constructor(
    private readonly membershipsIntegrationService: MembershipsIntegrationService,
    private readonly ptSessionPackagesIntegrationService: PtSessionPackagesIntegrationService,
  ) {
    super();
  }

  protected async executePosting(context: PostingContext): Promise<void> {
    // 1. Run default posting (GL entries)
    await super.executePosting(context);

    // 2. Run Membership integration for Credit Notes
    await this.membershipsIntegrationService.processCreditNote(
      context.document,
      context.manager,
    );

    // 3. Run PT package integration for Credit Notes
    await this.ptSessionPackagesIntegrationService.processCreditNote(
      context.document,
      context.manager,
    );
  }
}
