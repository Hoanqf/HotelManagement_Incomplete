"use client";

import { useState, useEffect } from "react";
import type { BookingFolio, RoomWithType } from "@/lib/types";
import { getAvailableRoomsByType, roomTypes } from "@/lib/mock-data";
import { format, differenceInDays, addDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Calendar,
  CreditCard,
  BedDouble,
  ArrowRightLeft,
  CalendarPlus,
  Phone,
  FileText,
  User,
  CheckCircle,
  DollarSign,
} from "lucide-react";

interface BookingFolioDialogProps {
  folio: BookingFolio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExtendStay: (bookingId: string, newCheckOutDate: string, newTotalAmount: number) => void;
  onChangeRoom: (bookingId: string, newRoomId: string) => void;
}

export function BookingFolioDialog({
  folio,
  open,
  onOpenChange,
  onExtendStay,
  onChangeRoom,
}: BookingFolioDialogProps) {
  const [extendDays, setExtendDays] = useState<number>(1);
  const [selectedNewRoom, setSelectedNewRoom] = useState<string>("");
  const [availableRooms, setAvailableRooms] = useState<RoomWithType[]>([]);

  useEffect(() => {
    if (folio) {
      const rooms = getAvailableRoomsByType(folio.room.roomTypeId, folio.room.id);
      setAvailableRooms(rooms);
      setSelectedNewRoom("");
      setExtendDays(1);
    }
  }, [folio]);

  if (!folio) return null;

  const checkIn = parseISO(folio.checkInDate);
  const checkOut = parseISO(folio.checkOutDate);
  const stayDuration = differenceInDays(checkOut, checkIn);
  const pricePerNight = folio.room.roomType.pricePerNight;

  const newCheckOutDate = addDays(checkOut, extendDays);
  const additionalCost = extendDays * pricePerNight;
  const newTotalAmount = folio.totalAmount + additionalCost;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleExtendStay = () => {
    onExtendStay(
      folio.id,
      format(newCheckOutDate, "yyyy-MM-dd"),
      newTotalAmount
    );
  };

  const handleRoomChange = () => {
    if (selectedNewRoom) {
      onChangeRoom(folio.id, selectedNewRoom);
    }
  };

  const getIdTypeBadge = (idType: string) => {
    switch (idType) {
      case "PASSPORT":
        return <Badge variant="default">Passport</Badge>;
      case "ID_CARD":
        return <Badge variant="secondary">ID Card</Badge>;
      case "DRIVER_LICENSE":
        return <Badge variant="outline">Driver License</Badge>;
      default:
        return <Badge variant="outline">{idType}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <BedDouble className="size-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Booking Folio - Room {folio.room.roomNumber}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Badge variant="secondary">{folio.room.roomType.name}</Badge>
                <span className="text-muted-foreground">|</span>
                <span>Booking #{folio.id.toUpperCase()}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="guests" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="guests" className="gap-2">
              <Users className="size-4" />
              <span className="hidden sm:inline">Guests</span>
            </TabsTrigger>
            <TabsTrigger value="booking" className="gap-2">
              <FileText className="size-4" />
              <span className="hidden sm:inline">Booking</span>
            </TabsTrigger>
            <TabsTrigger value="extend" className="gap-2">
              <CalendarPlus className="size-4" />
              <span className="hidden sm:inline">Extend</span>
            </TabsTrigger>
            <TabsTrigger value="change" className="gap-2">
              <ArrowRightLeft className="size-4" />
              <span className="hidden sm:inline">Change</span>
            </TabsTrigger>
          </TabsList>

          {/* Guest List Tab */}
          <TabsContent value="guests" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-5" />
                  Guest List ({folio.guests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest Name</TableHead>
                      <TableHead>ID Type</TableHead>
                      <TableHead>ID / Passport Number</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {folio.guests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex size-8 items-center justify-center rounded-full",
                                guest.isPrimary
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              <User className="size-4" />
                            </div>
                            <div>
                              <p className="font-medium">{guest.name}</p>
                              {guest.isPrimary && (
                                <span className="text-xs text-primary">Primary Guest</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getIdTypeBadge(guest.idType)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {guest.idNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="size-3 text-muted-foreground" />
                            {guest.phone}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking Info Tab */}
          <TabsContent value="booking" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="size-5" />
                    Primary Guest
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p className="text-lg font-semibold">{folio.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{folio.customerPhone}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="size-5" />
                    Stay Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Check-in</p>
                      <p className="font-medium">{format(checkIn, "MMM dd, yyyy")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Check-out</p>
                      <p className="font-medium">{format(checkOut, "MMM dd, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center rounded-md bg-muted py-2">
                    <span className="text-sm font-medium">
                      {stayDuration} night{stayDuration > 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="size-5" />
                  Billing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Room Rate</span>
                  <span>{formatCurrency(pricePerNight)} / night</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{stayDuration} nights</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Amount</span>
                  <span className="text-primary">{formatCurrency(folio.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stay Extension Tab */}
          <TabsContent value="extend" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarPlus className="size-5" />
                  Extend Stay
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Current Check-out Date</Label>
                    <div className="mt-1.5 flex h-10 items-center rounded-md border bg-muted px-3">
                      {format(checkOut, "MMMM dd, yyyy")}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="extend-days">Extend by (nights)</Label>
                    <Input
                      id="extend-days"
                      type="number"
                      min={1}
                      max={30}
                      value={extendDays}
                      onChange={(e) => setExtendDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <Separator />

                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-3 font-semibold">Price Calculation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">New Check-out Date</span>
                      <span className="font-medium">{format(newCheckOutDate, "MMMM dd, yyyy")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Additional Nights ({extendDays} x {formatCurrency(pricePerNight)})
                      </span>
                      <span className="font-medium text-amber-600">+{formatCurrency(additionalCost)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between text-base font-semibold">
                      <span>New Total Amount</span>
                      <span className="text-primary">{formatCurrency(newTotalAmount)}</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleExtendStay} className="w-full gap-2">
                  <CheckCircle className="size-4" />
                  Confirm Extension
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Room Change Tab */}
          <TabsContent value="change" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowRightLeft className="size-5" />
                  Change Room
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Current Room</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                      <BedDouble className="size-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Room {folio.room.roomNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {folio.room.roomType.name} - Floor {folio.room.floor}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Select New Room</Label>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Only showing available {folio.room.roomType.name} rooms
                  </p>
                  {availableRooms.length > 0 ? (
                    <Select value={selectedNewRoom} onValueChange={setSelectedNewRoom}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select a room..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Room {room.roomNumber} - Floor {room.floor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                      <BedDouble className="size-8 text-muted-foreground" />
                      <p className="mt-2 font-medium">No Available Rooms</p>
                      <p className="text-sm text-muted-foreground">
                        No other {folio.room.roomType.name} rooms are currently available
                      </p>
                    </div>
                  )}
                </div>

                {selectedNewRoom && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle className="size-5" />
                      <span className="font-medium">Room Selected</span>
                    </div>
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                      Guest will be moved to Room{" "}
                      {availableRooms.find((r) => r.id === selectedNewRoom)?.roomNumber}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleRoomChange}
                  disabled={!selectedNewRoom}
                  className="w-full gap-2"
                >
                  <ArrowRightLeft className="size-4" />
                  Confirm Room Change
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
