import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
  DataSource,
  EntityManager,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@EventSubscriber()
@Injectable()
export class AuditSubscriber implements EntitySubscriberInterface<BaseAuditEntity> {
  constructor(
    dataSource: DataSource,
    private readonly cls: ClsService,
  ) {
    dataSource.subscribers.push(this);
  }

  /**
   * Only listen to entities that extend BaseAuditEntity
   */
  listenTo() {
    return BaseAuditEntity;
  }

  private getCurrentUserId(): string | null {
    // Assuming you store the user object or ID in CLS under 'user' key
    // Adjust based on your AuthGuard implementation
    const user = this.cls.get<JwtPayload | null>('user');
    return user?.id ?? null;
  }

  beforeInsert(event: InsertEvent<BaseAuditEntity>) {
    if (event.entity instanceof BaseAuditEntity) {
      const userId = this.getCurrentUserId();
      if (userId) {
        event.entity.createdBy = userId;
        event.entity.updatedBy = userId;
      }
    }
  }

  async afterInsert(event: InsertEvent<BaseAuditEntity>) {
    if (event.entity instanceof BaseAuditEntity) {
      // We need to cast event.entity to access id, assuming it has one.
      // Most entities have 'id', but we should be careful.
      // BaseAuditEntity doesn't define 'id', but concrete entities do.
      const entityId = getEntityId(event.entity);

      if (entityId) {
        await this.createAuditLog(
          event.manager,
          'CREATE',
          event.metadata.tableName,
          entityId,
          null,
          toRecord(event.entity),
        );
      }
    }
  }

  beforeUpdate(event: UpdateEvent<BaseAuditEntity>) {
    if (event.entity instanceof BaseAuditEntity) {
      const userId = this.getCurrentUserId();
      if (userId) {
        event.entity.updatedBy = userId;
      }

      // We can also capture changes here for history
      // Note: event.databaseEntity constains the old values
    }
  }

  async afterUpdate(event: UpdateEvent<BaseAuditEntity>) {
    if (event.entity instanceof BaseAuditEntity && event.databaseEntity) {
      const entityId = getEntityId(event.databaseEntity);
      if (!entityId) {
        return;
      }
      await this.createAuditLog(
        event.manager,
        'UPDATE',
        event.metadata.tableName,
        entityId,
        toRecord(event.databaseEntity),
        toRecord(event.entity),
      );
    }
  }

  beforeSoftRemove(event: SoftRemoveEvent<BaseAuditEntity>) {
    if (event.entity instanceof BaseAuditEntity) {
      const userId = this.getCurrentUserId();
      if (userId) {
        event.entity.deletedBy = userId;
      }
    }
  }

  async afterSoftRemove(event: SoftRemoveEvent<BaseAuditEntity>) {
    // Soft remove updates the entity to set deletedAt, so strictly passed entity might hold the info
    if (event.entity instanceof BaseAuditEntity && event.databaseEntity) {
      const entityId = getEntityId(event.databaseEntity);
      if (!entityId) {
        return;
      }
      await this.createAuditLog(
        event.manager,
        'SOFT_REMOVE',
        event.metadata.tableName,
        entityId,
        toRecord(event.databaseEntity),
        null, // Or maybe { deletedAt: ... }
      );
    }
  }

  // Handling Hard Remove if necessary, though requirement implies we mostly do Soft Delete.
  // But for completeness:
  async afterRemove(event: RemoveEvent<BaseAuditEntity>) {
    if (event.databaseEntity instanceof BaseAuditEntity) {
      const entityId = getEntityId(event.databaseEntity);
      await this.createAuditLog(
        event.manager,
        'DELETE',
        event.metadata.tableName,
        entityId,
        toRecord(event.databaseEntity),
        null,
      );
    }
  }

  private async createAuditLog(
    manager: EntityManager,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_REMOVE',
    entityName: string,
    entityId: string,
    previousValues: Record<string, unknown> | null,
    newValues: Record<string, unknown> | null,
  ) {
    const userId = this.getCurrentUserId();

    // Clean up circular references or huge objects if necessary
    // For now, storing as is.

    const log = new AuditLogEntity();
    log.action = action;
    log.entityName = entityName;
    log.entityId = String(entityId);
    log.performedBy = userId;
    log.previousValues = previousValues;
    log.newValues = newValues;

    // Use the same transaction manager to ensure atomicity
    await manager.save(AuditLogEntity, log);
  }
}

function getEntityId(
  entity: BaseAuditEntity | null | undefined,
): string | null {
  if (!entity) {
    return null;
  }
  const candidate = (entity as { id?: unknown }).id;
  if (typeof candidate === 'string') {
    return candidate;
  }
  if (typeof candidate === 'number') {
    return String(candidate);
  }
  return null;
}

function toRecord(
  entity: BaseAuditEntity | null | undefined,
): Record<string, unknown> | null {
  if (!entity) {
    return null;
  }
  return entity as Record<string, unknown>;
}
