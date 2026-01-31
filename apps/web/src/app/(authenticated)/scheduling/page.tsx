"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format, addWeeks, subWeeks, startOfToday, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { WeekCalendar } from "@/components/scheduling/WeekCalendar";
import { TrainerSelector } from "@/components/scheduling/TrainerSelector";
import { BookingModal } from "@/components/scheduling/BookingModal";
import { BookingDetailModal } from "@/components/scheduling/BookingDetailModal";
import { AvailabilityManager } from "@/components/scheduling/AvailabilityManager";
import { DateTimeInput } from "@/components/ui/date-time-input";
import { peopleService, type PersonListItem } from "@/services/people";
import { ScheduleBookingsService } from "@/services/schedule-bookings";
import { TrainerAvailabilityService } from "@/services/trainer-availability";
import type { ScheduleBooking, TrainerAvailability, TrainerAvailabilityOverride, UpdateBookingDto } from "@gym-monorepo/shared";
import { PeopleType, BookingType, BookingStatus } from "@gym-monorepo/shared";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { PERMISSIONS } from "@gym-monorepo/shared";

export default function SchedulingPage() {
    const t = useTranslations("memberManagement.scheduling.page");
    const { toast } = useToast();
    const [viewDate, setViewDate] = useState(startOfToday());
    const [trainers, setTrainers] = useState<PersonListItem[]>([]);
    const [selectedTrainerIds, setSelectedTrainerIds] = useState<string[]>([]);
    const [bookings, setBookings] = useState<ScheduleBooking[]>([]);
    const [availability, setAvailability] = useState<TrainerAvailability[]>([]);
    const [overrides, setOverrides] = useState<TrainerAvailabilityOverride[]>([]);
    const [loading, setLoading] = useState(true);

    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingModalInitialData, setBookingModalInitialData] = useState<any>(null);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<ScheduleBooking | null>(null);

    const [isAvailManagerOpen, setIsAvailManagerOpen] = useState(false);
    const [managingTrainer, setManagingTrainer] = useState<PersonListItem | null>(null);

    // Fetch all staff/trainers
    useEffect(() => {
        const fetchTrainers = async () => {
            try {
                const response = await peopleService.list({ page: 1, limit: 100, type: PeopleType.STAFF });
                setTrainers(response.items);
                // Pre-select first 3 trainers if available
                if (response.items.length > 0) {
                    setSelectedTrainerIds(response.items.slice(0, 3).map(t => t.id));
                }
            } catch (error) {
                console.error("Failed to fetch trainers", error);
            }
        };
        fetchTrainers();
    }, []);

    const fetchData = async () => {
        if (selectedTrainerIds.length === 0) {
            setBookings([]);
            setAvailability([]);
            setOverrides([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const start = startOfWeek(viewDate, { weekStartsOn: 1 });
            const end = endOfWeek(viewDate, { weekStartsOn: 1 });

            const dateFrom = format(start, "yyyy-MM-dd");
            const dateTo = format(end, "yyyy-MM-dd");

            // Bulk fetch for all selected trainers
            const bookingsPromises = selectedTrainerIds.map(id =>
                ScheduleBookingsService.findAll({ trainerId: id, dateFrom, dateTo, limit: 1000 })
            );

            const availabilityPromises = selectedTrainerIds.map(id =>
                TrainerAvailabilityService.getAvailability(id)
            );

            const overridesPromises = selectedTrainerIds.map(id =>
                TrainerAvailabilityService.getOverrides(id, dateFrom, dateTo)
            );

            const [bookingsResults, availabilityResults, overridesResults] = await Promise.all([
                Promise.all(bookingsPromises),
                Promise.all(availabilityPromises),
                Promise.all(overridesPromises)
            ]);

            setBookings(bookingsResults.flatMap(r => r.items));
            setAvailability(availabilityResults.flat());
            setOverrides(overridesResults.flat());
        } catch (error) {
            console.error("Failed to fetch calendar data", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch bookings and availability for selected trainers and current week
    useEffect(() => {
        fetchData();
    }, [viewDate, selectedTrainerIds]);

    const handlePrevWeek = () => setViewDate(prev => subWeeks(prev, 1));
    const handleNextWeek = () => setViewDate(prev => addWeeks(prev, 1));
    const handleToday = () => setViewDate(startOfToday());

    const toggleTrainer = (id: string) => {
        setSelectedTrainerIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const handleSlotClick = (day: Date, time: string) => {
        setBookingModalInitialData({
            bookingDate: format(day, "yyyy-MM-dd"),
            startTime: time,
            trainerId: selectedTrainerIds[0] || "",
        });
        setIsBookingModalOpen(true);
    };

    const handleBookingClick = (booking: ScheduleBooking) => {
        setSelectedBooking(booking);
        setIsDetailModalOpen(true);
    };

    const handleStatusUpdate = async (id: string, action: "complete" | "cancel" | "no-show", reason?: string) => {
        try {
            if (action === "complete") await ScheduleBookingsService.complete(id);
            else if (action === "cancel") await ScheduleBookingsService.cancel(id, reason || "Cancelled from UI");
            else if (action === "no-show") await ScheduleBookingsService.noShow(id);

            toast({ title: "Success", description: `Booking ${action}ed.` });
            fetchData();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || `Failed to ${action} booking.`,
            });
            throw error;
        }
    };

    const handleUpdateBooking = async (id: string, data: UpdateBookingDto) => {
        try {
            await ScheduleBookingsService.update(id, data);
            toast({ title: "Success", description: "Booking updated." });
            fetchData();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to update booking.",
            });
            throw error;
        }
    };

    const handleBookingSubmit = async (values: any) => {
        try {
            await ScheduleBookingsService.create(values);
            toast({
                title: "Success",
                description: "Booking created successfully.",
            });
            fetchData();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to create booking.",
            });
            throw error;
        }
    };

    const handleManageTrainer = (trainer: PersonListItem) => {
        setManagingTrainer(trainer);
        setIsAvailManagerOpen(true);
    };

    const selectedTrainers = useMemo(() =>
        trainers.filter(t => selectedTrainerIds.includes(t.id)),
        [trainers, selectedTrainerIds]
    );

    return (
        <PermissionGuard requiredPermissions={[PERMISSIONS.SCHEDULES.READ]}>
            <div className="flex h-full flex-col space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                        <p className="text-sm text-muted-foreground">
                            {format(startOfWeek(viewDate, { weekStartsOn: 1 }), "MMM d")} - {format(endOfWeek(viewDate, { weekStartsOn: 1 }), "MMM d, yyyy")}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-[160px]">
                            <DateTimeInput
                                enableTime={false}
                                value={format(viewDate, "yyyy-MM-dd")}
                                onChange={(e) => {
                                    const newDate = parseISO(e.target.value);
                                    if (!isNaN(newDate.getTime())) {
                                        setViewDate(newDate);
                                    }
                                }}
                                className="h-9"
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={handleToday}>
                            Today
                        </Button>
                        <div className="flex items-center rounded-md border shadow-sm bg-background">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r" onClick={handlePrevWeek}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={handleNextWeek}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
                        <span className="text-sm font-semibold">Trainers:</span>
                        <TrainerSelector
                            trainers={trainers}
                            selectedIds={selectedTrainerIds}
                            onToggle={toggleTrainer}
                            onManage={handleManageTrainer}
                        />
                    </div>

                    <div className="relative min-h-[500px] overflow-hidden rounded-lg border bg-background">
                        {loading && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        <WeekCalendar
                            date={viewDate}
                            bookings={bookings}
                            trainers={selectedTrainers}
                            availability={availability}
                            overrides={overrides}
                            onSlotClick={handleSlotClick}
                            onBookingClick={handleBookingClick}
                        />
                    </div>
                </div>

                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    onSubmit={handleBookingSubmit}
                    trainers={trainers}
                    initialData={bookingModalInitialData}
                />

                <BookingDetailModal
                    booking={selectedBooking}
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    onStatusUpdate={handleStatusUpdate}
                    onUpdate={handleUpdateBooking}
                />

                {managingTrainer && (
                    <AvailabilityManager
                        trainerId={managingTrainer.id}
                        trainerName={managingTrainer.fullName}
                        isOpen={isAvailManagerOpen}
                        onClose={() => setIsAvailManagerOpen(false)}
                        onUpdate={fetchData}
                    />
                )}
            </div>
        </PermissionGuard>
    );
}
