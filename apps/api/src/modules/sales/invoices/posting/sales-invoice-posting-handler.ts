import { DefaultPostingHandler } from '../../../documents/posting/default-posting-handler';
import { PostingContext } from '../../../documents/posting/posting-handler.interface';
import { MembershipsIntegrationService } from '../../../memberships/memberships-integration.service';

export class SalesInvoicePostingHandler extends DefaultPostingHandler {
  constructor(
    private readonly membershipsIntegrationService: MembershipsIntegrationService,
  ) {
    super();
  }

  protected async executePosting(context: PostingContext): Promise<void> {
    // 1. Run default posting (GL entries)
    await super.executePosting(context);

    // 2. Run Membership integration
    await this.membershipsIntegrationService.processSalesInvoice(
      context.document,
      context.manager,
      context.tenantId,
      context.userId,
    );
  }
}
