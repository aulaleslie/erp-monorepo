import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionEntity } from '../../database/entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  async findAll(): Promise<PermissionEntity[]> {
    const permissions = await this.permissionRepository.find({
      order: { group: 'ASC', name: 'ASC' },
    });

    // Filter out theme permissions that were removed
    return permissions.filter(
      (permission) =>
        permission.code !== 'settings.theme.read' &&
        permission.code !== 'settings.theme.update',
    );
  }
}
