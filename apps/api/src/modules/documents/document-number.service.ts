import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { DocumentNumberSettingEntity } from '../../database/entities/document-number-setting.entity';

@Injectable()
export class DocumentNumberService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Generates the next unique document number for a given tenant and document type.
   * Uses pessimistic locking and handles period-based counter resets.
   */
  async getNextDocumentNumber(
    tenantId: string,
    documentKey: string,
  ): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Get or create settings with pessimistic lock
      const settings = await this.getOrCreateSettingsForUpdate(
        tenantId,
        documentKey,
        manager,
      );

      // 2. Calculate current period
      const currentPeriod = settings.includePeriod
        ? this.formatPeriod(new Date(), settings.periodFormat)
        : null;

      // 3. Check if period changed — reset counter if so (Option B)
      if (settings.includePeriod && settings.lastPeriod !== currentPeriod) {
        settings.currentCounter = 0;
        settings.lastPeriod = currentPeriod;
      }

      // 4. Increment counter
      settings.currentCounter += 1;
      await manager.save(settings);

      // 5. Format the document number
      return this.formatDocumentNumber(settings, currentPeriod);
    });
  }

  /**
   * Formats the final document number string.
   */
  private formatDocumentNumber(
    settings: DocumentNumberSettingEntity,
    currentPeriod: string | null,
  ): string {
    let number = settings.prefix;

    if (settings.includePeriod && currentPeriod) {
      number += `-${currentPeriod}`;
    }

    const paddedCounter = String(settings.currentCounter).padStart(
      settings.paddingLength,
      '0',
    );
    number += `-${paddedCounter}`;

    return number;
  }

  /**
   * Simple period formatter.
   */
  private formatPeriod(date: Date, format: string): string {
    return format
      .replace('yyyy', date.getFullYear().toString())
      .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
      .replace('dd', String(date.getDate()).padStart(2, '0'));
  }

  /**
   * Fetches settings with a pessimistic write lock, or creates them if missing.
   */
  private async getOrCreateSettingsForUpdate(
    tenantId: string,
    documentKey: string,
    manager: EntityManager,
  ): Promise<DocumentNumberSettingEntity> {
    const repository = manager.getRepository(DocumentNumberSettingEntity);

    // Try to find with pessimistic lock
    let settings = await repository
      .createQueryBuilder('settings')
      .setLock('pessimistic_write')
      .where('settings.tenantId = :tenantId', { tenantId })
      .andWhere('settings.documentKey = :documentKey', { documentKey })
      .getOne();

    if (!settings) {
      // Create with defaults
      const defaults = this.getDefaultsForDocumentKey(documentKey);
      await repository
        .createQueryBuilder()
        .insert()
        .into(DocumentNumberSettingEntity)
        .values({
          tenantId,
          documentKey,
          ...defaults,
        })
        .orIgnore()
        .execute();

      // Re-fetch with lock
      settings = await repository
        .createQueryBuilder('settings')
        .setLock('pessimistic_write')
        .where('settings.tenantId = :tenantId', { tenantId })
        .andWhere('settings.documentKey = :documentKey', { documentKey })
        .getOne();
    }

    if (!settings) {
      throw new InternalServerErrorException(
        `Failed to initialize document number settings for ${documentKey}`,
      );
    }

    return settings;
  }

  /**
   * Provides default configuration for known document keys.
   */
  private getDefaultsForDocumentKey(
    documentKey: string,
  ): Partial<DocumentNumberSettingEntity> {
    const DEFAULTS: Record<string, { prefix: string }> = {
      'sales.order': { prefix: 'SO' },
      'sales.invoice': { prefix: 'INV' },
      'sales.credit_note': { prefix: 'CN' },
      'purchasing.po': { prefix: 'PO' },
      'purchasing.grn': { prefix: 'GRN' },
      'accounting.journal': { prefix: 'JE' },
      'inventory.transfer': { prefix: 'TRF' },
      'inventory.adjustment': { prefix: 'ADJ' },
      'inventory.count': { prefix: 'CNT' },
    };

    const config = DEFAULTS[documentKey] ?? {
      prefix: documentKey.toUpperCase().replace('.', '-'),
    };

    return {
      prefix: config.prefix,
      paddingLength: 6,
      includePeriod: true,
      periodFormat: 'yyyy-MM',
      currentCounter: 0,
      lastPeriod: null,
    };
  }

  async findAllSettings(
    tenantId: string,
  ): Promise<DocumentNumberSettingEntity[]> {
    return this.dataSource.getRepository(DocumentNumberSettingEntity).find({
      where: { tenantId },
      order: { documentKey: 'ASC' },
    });
  }

  async findOneSetting(
    tenantId: string,
    documentKey: string,
  ): Promise<DocumentNumberSettingEntity> {
    const settings = await this.dataSource
      .getRepository(DocumentNumberSettingEntity)
      .findOne({
        where: { tenantId, documentKey },
      });

    if (!settings) {
      // Return defaults if not found (doesn't create in DB yet)
      const defaults = this.getDefaultsForDocumentKey(documentKey);
      return this.dataSource.getRepository(DocumentNumberSettingEntity).create({
        tenantId,
        documentKey,
        ...defaults,
      });
    }

    return settings;
  }

  async updateSetting(
    tenantId: string,
    documentKey: string,
    data: Partial<DocumentNumberSettingEntity>,
  ): Promise<DocumentNumberSettingEntity> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(DocumentNumberSettingEntity);

      let settings = await repository.findOne({
        where: { tenantId, documentKey },
      });

      if (!settings) {
        const defaults = this.getDefaultsForDocumentKey(documentKey);
        settings = repository.create({
          tenantId,
          documentKey,
          ...defaults,
          ...data,
        });
      } else {
        Object.assign(settings, data);
      }

      return repository.save(settings);
    });
  }
}
