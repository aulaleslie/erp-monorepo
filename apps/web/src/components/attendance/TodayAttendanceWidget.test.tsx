import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TodayAttendanceWidget } from './TodayAttendanceWidget';
import { AttendanceService } from '@/services/attendance';

// Mock next-intl
vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => {
        if (key === 'checkIn.title') return "Today's Attendance";
        if (key === 'checkIn.quickCheckIn') return "Quick Check-in";
        if (key === 'history.title') return "Attendance History";
        if (key === 'checkIn.types.GYM_ENTRY') return "Gym Entry";
        return key;
    },
}));

// Mock AttendanceService
vi.mock('@/services/attendance', () => ({
    AttendanceService: {
        getTodayCheckIns: vi.fn(),
    },
}));

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

describe('TodayAttendanceWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        vi.mocked(AttendanceService.getTodayCheckIns).mockReturnValue(new Promise(() => { }));
        render(<TodayAttendanceWidget />);
        expect(screen.getByText("Today's Attendance")).toBeInTheDocument();
    });

    it('renders recent check-ins when data is loaded', async () => {
        const mockData = [
            {
                id: '1',
                checkInAt: new Date().toISOString(),
                attendanceType: 'GYM_ENTRY',
                member: {
                    person: { fullName: 'John Doe' }
                }
            }
        ];
        vi.mocked(AttendanceService.getTodayCheckIns).mockResolvedValue(mockData);

        render(<TodayAttendanceWidget />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        expect(screen.getByText(/1 Checked In/)).toBeInTheDocument();
        expect(screen.getByText('Quick Check-in')).toBeInTheDocument();
        expect(screen.getByText('Attendance History')).toBeInTheDocument();
    });

    it('renders empty state when no check-ins', async () => {
        vi.mocked(AttendanceService.getTodayCheckIns).mockResolvedValue([]);

        render(<TodayAttendanceWidget />);

        await waitFor(() => {
            expect(screen.getByText('No check-ins today.')).toBeInTheDocument();
        });

        expect(screen.getByText(/0 Checked In/)).toBeInTheDocument();
        expect(screen.getByText('Quick Check-in')).toBeInTheDocument();
    });

    it('links to correct pages', async () => {
        vi.mocked(AttendanceService.getTodayCheckIns).mockResolvedValue([]);

        render(<TodayAttendanceWidget />);

        await waitFor(() => {
            const checkInLink = screen.getByText('Quick Check-in').closest('a');
            expect(checkInLink).toHaveAttribute('href', '/attendance/check-in');

            const historyLink = screen.getByText('Attendance History').closest('a');
            expect(historyLink).toHaveAttribute('href', '/attendance');
        });
    });
});
