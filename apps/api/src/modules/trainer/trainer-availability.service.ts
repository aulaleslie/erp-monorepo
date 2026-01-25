import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { TrainerAvailabilityEntity } from '../../database/entities/trainer-availability.entity';
import { TrainerAvailabilityOverrideEntity } from '../../database/entities/trainer-availability-override.entity';
import { UpdateTrainerAvailabilityDto } from './dto/update-trainer-availability.dto';
import { CreateTrainerAvailabilityOverrideDto } from './dto/create-trainer-availability-override.dto';
import { OverrideType } from '@gym-monorepo/shared';

@Injectable()
export class TrainerAvailabilityService {
  constructor(
    @InjectRepository(TrainerAvailabilityEntity)
    private readonly availabilityRepository: Repository<TrainerAvailabilityEntity>,
    @InjectRepository(TrainerAvailabilityOverrideEntity)
    private readonly overrideRepository: Repository<TrainerAvailabilityOverrideEntity>,
  ) {}

  async getWeeklyTemplate(tenantId: string, trainerId: string) {
    return this.availabilityRepository.find({
      where: { tenantId, trainerId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async updateWeeklyTemplate(
    tenantId: string,
    trainerId: string,
    dtos: UpdateTrainerAvailabilityDto[],
  ) {
    // Basic implementation: delete existing and insert new
    // In a real scenario, we might want a more sophisticated sync
    await this.availabilityRepository.delete({ tenantId, trainerId });

    const entities = dtos.map((dto) =>
      this.availabilityRepository.create({
        ...dto,
        tenantId,
        trainerId,
      }),
    );

    return this.availabilityRepository.save(entities);
  }

  async getOverrides(
    tenantId: string,
    trainerId: string,
    dateFrom: string,
    dateTo: string,
  ) {
    return this.overrideRepository.find({
      where: {
        tenantId,
        trainerId,
        date: Between(dateFrom, dateTo),
      },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async createOverride(
    tenantId: string,
    trainerId: string,
    dto: CreateTrainerAvailabilityOverrideDto,
  ) {
    const override = this.overrideRepository.create({
      ...dto,
      tenantId,
      trainerId,
    });
    return this.overrideRepository.save(override);
  }

  async deleteOverride(tenantId: string, trainerId: string, id: string) {
    const result = await this.overrideRepository.delete({
      id,
      tenantId,
      trainerId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Override not found');
    }
  }

  async getAvailableSlots(tenantId: string, trainerId: string, date: string) {
    const dayOfWeek = new Date(date).getDay();

    // 1. Get weekly template for the day of week
    const templateSlots = await this.availabilityRepository.find({
      where: { tenantId, trainerId, dayOfWeek, isActive: true },
      order: { startTime: 'ASC' },
    });

    // 2. Get overrides for the specific date
    const overrides = await this.overrideRepository.find({
      where: { tenantId, trainerId, date },
    });

    // 3. Compute slots
    // If there's a BLOCKED override for the whole day (startTime/endTime null), trainer is unavailable.
    const dayBlocked = overrides.find(
      (o) => o.overrideType === OverrideType.BLOCKED && !o.startTime,
    );
    if (dayBlocked) {
      return [];
    }

    let availableWindows = templateSlots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));

    // Apply MODIFIED overrides
    const modifiedOverrides = overrides.filter(
      (o) => o.overrideType === OverrideType.MODIFIED,
    );
    if (modifiedOverrides.length > 0) {
      // If any MODIFIED exists, it replaces the template for those hours or adds to it?
      // Requirement C6D-BE-02: "MODIFIED: different hours than template."
      // Typically, for a specific date, MODIFIED overrides would be the truth.
      // Let's assume MODIFIED overrides replace the template slots for that day if they exist.
      // Or they specify specific windows. Let's treat them as additional/replacement windows.
      availableWindows = modifiedOverrides.map((o) => ({
        startTime: o.startTime!,
        endTime: o.endTime!,
      }));
    }

    // Apply partial BLOCKED overrides
    const partialBlocked = overrides.filter(
      (o) => o.overrideType === OverrideType.BLOCKED && o.startTime,
    );
    for (const blocked of partialBlocked) {
      availableWindows = this.subtractWindow(
        availableWindows,
        blocked.startTime!,
        blocked.endTime!,
      );
    }

    // 4. Subtract existing bookings
    // TODO: Implement once ScheduleBookingEntity is available (C6E-BE-01)
    // const bookings = await this.bookingRepository.find({ where: { trainerId, bookingDate: date, status: In(['SCHEDULED', 'COMPLETED']) } });
    // for (const booking of bookings) {
    //   availableWindows = this.subtractWindow(availableWindows, booking.startTime, booking.endTime);
    // }

    return availableWindows;
  }

  private subtractWindow(
    windows: { startTime: string; endTime: string }[],
    blockStart: string,
    blockEnd: string,
  ) {
    const result: { startTime: string; endTime: string }[] = [];

    for (const window of windows) {
      // No overlap
      if (blockEnd <= window.startTime || blockStart >= window.endTime) {
        result.push(window);
        continue;
      }

      // Block covers entire window
      if (blockStart <= window.startTime && blockEnd >= window.endTime) {
        continue;
      }

      // Block splits window
      if (blockStart > window.startTime && blockEnd < window.endTime) {
        result.push({ startTime: window.startTime, endTime: blockStart });
        result.push({ startTime: blockEnd, endTime: window.endTime });
        continue;
      }

      // Block chops start
      if (blockStart <= window.startTime && blockEnd < window.endTime) {
        result.push({ startTime: blockEnd, endTime: window.endTime });
        continue;
      }

      // Block chops end
      if (blockStart > window.startTime && blockEnd >= window.endTime) {
        result.push({ startTime: window.startTime, endTime: blockStart });
        continue;
      }
    }

    return result;
  }
}
