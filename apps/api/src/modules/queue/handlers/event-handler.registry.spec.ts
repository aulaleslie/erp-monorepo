import { Test, TestingModule } from '@nestjs/testing';
import { OutboxEventKey } from '@gym-monorepo/shared';
import { EventHandlerRegistry } from './event-handler.registry';
import { DocumentOutboxEntity } from '../../../database/entities/document-outbox.entity';
import { IEventHandler } from './event-handler.interface';

describe('EventHandlerRegistry', () => {
  let registry: EventHandlerRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventHandlerRegistry],
    }).compile();

    registry = module.get<EventHandlerRegistry>(EventHandlerRegistry);
  });

  it('should be defined', () => {
    expect(registry).toBeDefined();
  });

  it('should route event to correct handler', async () => {
    const mockHandler: IEventHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
    };
    const eventKey = 'document.submitted' as OutboxEventKey;
    const event = { eventKey } as DocumentOutboxEntity;

    registry.registerHandler(eventKey, mockHandler);
    await registry.handle(event);

    expect(mockHandler.handle).toHaveBeenCalledWith(event);
  });

  it('should use fallback (stub) handler for unregistered events', async () => {
    const event = {
      eventKey: 'unknown.event',
      id: '1',
      eventVersion: 1,
    } as DocumentOutboxEntity;

    // Should not throw, uses StubEventHandler internally
    await expect(registry.handle(event)).resolves.not.toThrow();
  });
});
