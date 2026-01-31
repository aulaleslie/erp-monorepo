import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekCalendar } from './WeekCalendar';
import { startOfToday, format, addDays, startOfWeek } from 'date-fns';

describe('WeekCalendar', () => {
    const today = startOfToday();
    const mockTrainers = [
        { id: 't1', fullName: 'Trainer One' },
        { id: 't2', fullName: 'Trainer Two' },
    ] as any;

    const mockAvailability = [
        {
            trainerId: 't1',
            dayOfWeek: today.getDay(),
            isActive: true,
            startTime: '09:00:00',
            endTime: '12:00:00',
        },
    ] as any;

    const mockBookings = [
        {
            id: 'b1',
            trainerId: 't1',
            memberId: 'm1',
            member: { person: { fullName: 'Member One' } },
            bookingDate: format(today, 'yyyy-MM-dd'),
            startTime: '10:00:00',
            durationMinutes: 60,
            bookingType: 'PT_SESSION',
        },
    ] as any;

    it('renders the week days correctly', () => {
        render(
            <WeekCalendar
                date={today}
                bookings={[]}
                trainers={mockTrainers}
                availability={[]}
                overrides={[]}
            />
        );

        const start = startOfToday();
        for (let i = 0; i < 7; i++) {
            const day = addDays(startOfWeek(start, { weekStartsOn: 1 }), i);
            expect(screen.getAllByText(format(day, 'EEE'))).toBeTruthy();
        }
    });

    it('displays availability indicators for available slots', () => {
        render(
            <WeekCalendar
                date={today}
                bookings={[]}
                trainers={mockTrainers}
                availability={mockAvailability}
                overrides={[]}
            />
        );

        // Check for availability indicator (mini-dot)
        expect(screen.getAllByTitle('Trainer One').length).toBeGreaterThan(0);
    });

    it('renders bookings', () => {
        render(
            <WeekCalendar
                date={today}
                bookings={mockBookings}
                trainers={mockTrainers}
                availability={[]}
                overrides={[]}
            />
        );

        expect(screen.getByText('Member One')).toBeInTheDocument();
        expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('calls onSlotClick when an available slot is clicked', () => {
        const onSlotClick = vi.fn();
        render(
            <WeekCalendar
                date={today}
                bookings={[]}
                trainers={mockTrainers}
                availability={mockAvailability}
                overrides={[]}
                onSlotClick={onSlotClick}
            />
        );

        // Click the first 9 AM slot.
        const indicators = screen.getAllByTitle('Trainer One');
        const slot = indicators[0].parentElement?.parentElement;
        if (slot) {
            fireEvent.click(slot);
        }

        expect(onSlotClick).toHaveBeenCalled();
    });

    it('calls onBookingClick when a booking is clicked', () => {
        const onBookingClick = vi.fn();
        render(
            <WeekCalendar
                date={today}
                bookings={mockBookings}
                trainers={mockTrainers}
                availability={[]}
                overrides={[]}
                onBookingClick={onBookingClick}
            />
        );

        fireEvent.click(screen.getByText('Member One'));
        expect(onBookingClick).toHaveBeenCalledWith(mockBookings[0]);
    });
});
