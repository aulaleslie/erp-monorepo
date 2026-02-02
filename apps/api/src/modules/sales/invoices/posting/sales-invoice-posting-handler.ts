import { DefaultPostingHandler } from '../../../documents/posting/default-posting-handler';
import { PostingContext } from '../../../documents/posting/posting-handler.interface';
import { MembershipsIntegrationService } from '../../../memberships/memberships-integration.service';
import { PtSessionPackagesIntegrationService } from '../../../pt-session-packages/pt-session-packages-integration.service';
import { GroupSessionsIntegrationService } from '../../../group-sessions/group-sessions-integration.service';

export class SalesInvoicePostingHandler extends DefaultPostingHandler {
  constructor(
    private readonly membershipsIntegrationService: MembershipsIntegrationService,
    private readonly ptSessionPackagesIntegrationService: PtSessionPackagesIntegrationService,
    private readonly groupSessionsIntegrationService: GroupSessionsIntegrationService,
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

    // 3. Run PT package integration
    await this.ptSessionPackagesIntegrationService.processSalesInvoice(
      context.document,
      context.manager,
      context.tenantId,
      context.userId,
    );

    // 4. Run Group Session integration
    await this.groupSessionsIntegrationService.processSalesInvoice(
      context.document,
      context.manager,
      context.tenantId,
      context.userId,
    );
  }
}
