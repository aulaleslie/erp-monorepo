import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
  DataSource,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { BaseAuditEntity } from '../../common/entities/base-audit.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';

@EventSubscriber()
@Injectable()
export class AuditSubscriber implements EntitySubscriberInterface {
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
    const user = this.cls.get('user');
    return user ? user.id : null;
  }

  async beforeInsert(event: InsertEvent<any>) {
    if (event.entity instanceof BaseAuditEntity) {
      const userId = this.getCurrentUserId();
      if (userId) {
        event.entity.createdBy = userId;
        event.entity.updatedBy = userId;
      }
    }
  }

  async afterInsert(event: InsertEvent<any>) {
    if (event.entity instanceof BaseAuditEntity) {
      // We need to cast event.entity to access id, assuming it has one.
      // Most entities have 'id', but we should be careful.
      // BaseAuditEntity doesn't define 'id', but concrete entities do.
      const entityId = (event.entity as any).id;

      if (entityId) {
        await this.createAuditLog(
          event.manager,
          'CREATE',
          event.metadata.tableName,
          entityId,
          null,
          event.entity,
        );
      }
    }
  }

  async beforeUpdate(event: UpdateEvent<any>) {
    if (event.entity instanceof BaseAuditEntity) {
      const userId = this.getCurrentUserId();
      if (userId) {
        event.entity.updatedBy = userId;
      }

      // We can also capture changes here for history
      // Note: event.databaseEntity constains the old values
    }
  }

  async afterUpdate(event: UpdateEvent<any>) {
    if (event.entity instanceof BaseAuditEntity && event.databaseEntity) {
      const entityId = event.databaseEntity.id;
      await this.createAuditLog(
        event.manager,
        'UPDATE',
        event.metadata.tableName,
        entityId,
        event.databaseEntity,
        event.entity,
      );
    }
  }

  async beforeSoftRemove(event: SoftRemoveEvent<any>) {
    if (event.entity instanceof BaseAuditEntity) {
      const userId = this.getCurrentUserId();
      if (userId) {
        event.entity.deletedBy = userId;
      }
    }
  }

  async afterSoftRemove(event: SoftRemoveEvent<any>) {
    // Soft remove updates the entity to set deletedAt, so strictly passed entity might hold the info
    if (event.entity instanceof BaseAuditEntity && event.databaseEntity) {
      const entityId = event.databaseEntity.id;
      await this.createAuditLog(
        event.manager,
        'SOFT_REMOVE',
        event.metadata.tableName,
        entityId,
        event.databaseEntity,
        null, // Or maybe { deletedAt: ... }
      );
    }
  }

  // Handling Hard Remove if necessary, though requirement implies we mostly do Soft Delete.
  // But for completeness:
  async afterRemove(event: RemoveEvent<any>) {
    if (event.databaseEntity instanceof BaseAuditEntity) {
      const entityId = (event.databaseEntity as any).id;
      await this.createAuditLog(
        event.manager,
        'DELETE',
        event.metadata.tableName,
        entityId,
        event.databaseEntity,
        null,
      );
    }
  }

  private async createAuditLog(
    manager: any,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_REMOVE',
    entityName: string,
    entityId: string,
    previousValues: any,
    newValues: any,
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
