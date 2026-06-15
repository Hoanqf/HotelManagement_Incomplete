import type {
  RoomType,
  Room,
  Booking,
  Service,
  Invoice,
  RoomWithType,
  BookingWithRoom,
  User,
  MaintenanceRecord,
  MaintenanceRecordWithDetails,
  Amenity,
  Guest,
  BookingFolio,
} from "./types";

// Room Types
export const roomTypes: RoomType[] = [
  {
    id: "rt-1",
    name: "Standard",
    pricePerNight: 99,
    capacity: 2,
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Bar"],
  },
  {
    id: "rt-2",
    name: "Deluxe",
    pricePerNight: 179,
    capacity: 3,
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Bar", "Balcony", "Room Service"],
  },
  {
    id: "rt-3",
    name: "Suite",
    pricePerNight: 299,
    capacity: 4,
    amenities: [
      "WiFi",
      "TV",
      "Air Conditioning",
      "Mini Bar",
      "Balcony",
      "Room Service",
      "Living Room",
      "Jacuzzi",
    ],
  },
];

// Generate rooms across 4 floors
export const rooms: Room[] = [
  // Floor 1 - Standard Rooms
  { id: "r-101", roomNumber: "101", status: "AVAILABLE", roomTypeId: "rt-1", floor: 1 },
  { id: "r-102", roomNumber: "102", status: "OCCUPIED", roomTypeId: "rt-1", floor: 1 },
  { id: "r-103", roomNumber: "103", status: "DIRTY", roomTypeId: "rt-1", floor: 1 },
  { id: "r-104", roomNumber: "104", status: "AVAILABLE", roomTypeId: "rt-1", floor: 1 },
  { id: "r-105", roomNumber: "105", status: "OCCUPIED", roomTypeId: "rt-1", floor: 1 },
  { id: "r-106", roomNumber: "106", status: "MAINTENANCE", roomTypeId: "rt-1", floor: 1 },
  // Floor 2 - Standard & Deluxe Rooms
  { id: "r-201", roomNumber: "201", status: "AVAILABLE", roomTypeId: "rt-1", floor: 2 },
  { id: "r-202", roomNumber: "202", status: "OCCUPIED", roomTypeId: "rt-1", floor: 2 },
  { id: "r-203", roomNumber: "203", status: "AVAILABLE", roomTypeId: "rt-2", floor: 2 },
  { id: "r-204", roomNumber: "204", status: "DIRTY", roomTypeId: "rt-2", floor: 2 },
  { id: "r-205", roomNumber: "205", status: "OCCUPIED", roomTypeId: "rt-2", floor: 2 },
  { id: "r-206", roomNumber: "206", status: "AVAILABLE", roomTypeId: "rt-2", floor: 2 },
  // Floor 3 - Deluxe Rooms
  { id: "r-301", roomNumber: "301", status: "OCCUPIED", roomTypeId: "rt-2", floor: 3 },
  { id: "r-302", roomNumber: "302", status: "AVAILABLE", roomTypeId: "rt-2", floor: 3 },
  { id: "r-303", roomNumber: "303", status: "AVAILABLE", roomTypeId: "rt-2", floor: 3 },
  { id: "r-304", roomNumber: "304", status: "DIRTY", roomTypeId: "rt-2", floor: 3 },
  { id: "r-305", roomNumber: "305", status: "OCCUPIED", roomTypeId: "rt-2", floor: 3 },
  { id: "r-306", roomNumber: "306", status: "MAINTENANCE", roomTypeId: "rt-2", floor: 3 },
  // Floor 4 - Suite Rooms
  { id: "r-401", roomNumber: "401", status: "AVAILABLE", roomTypeId: "rt-3", floor: 4 },
  { id: "r-402", roomNumber: "402", status: "OCCUPIED", roomTypeId: "rt-3", floor: 4 },
  { id: "r-403", roomNumber: "403", status: "AVAILABLE", roomTypeId: "rt-3", floor: 4 },
  { id: "r-404", roomNumber: "404", status: "DIRTY", roomTypeId: "rt-3", floor: 4 },
  { id: "r-405", roomNumber: "405", status: "OCCUPIED", roomTypeId: "rt-3", floor: 4 },
  { id: "r-406", roomNumber: "406", status: "AVAILABLE", roomTypeId: "rt-3", floor: 4 },
];

// Bookings
export const bookings: Booking[] = [
  {
    id: "b-1",
    roomId: "r-102",
    checkInDate: "2026-05-20",
    checkOutDate: "2026-05-24",
    customerName: "John Smith",
    customerPhone: "+1 555-0101",
    status: "CHECKED_IN",
    totalAmount: 396,
    createdAt: "2026-05-15T10:30:00Z",
  },
  {
    id: "b-2",
    roomId: "r-105",
    checkInDate: "2026-05-21",
    checkOutDate: "2026-05-23",
    customerName: "Emily Johnson",
    customerPhone: "+1 555-0102",
    status: "CHECKED_IN",
    totalAmount: 198,
    createdAt: "2026-05-18T14:20:00Z",
  },
  {
    id: "b-3",
    roomId: "r-202",
    checkInDate: "2026-05-22",
    checkOutDate: "2026-05-25",
    customerName: "Michael Brown",
    customerPhone: "+1 555-0103",
    status: "CHECKED_IN",
    totalAmount: 297,
    createdAt: "2026-05-19T09:15:00Z",
  },
  {
    id: "b-4",
    roomId: "r-205",
    checkInDate: "2026-05-19",
    checkOutDate: "2026-05-22",
    customerName: "Sarah Davis",
    customerPhone: "+1 555-0104",
    status: "CHECKED_IN",
    totalAmount: 537,
    createdAt: "2026-05-16T11:45:00Z",
  },
  {
    id: "b-5",
    roomId: "r-301",
    checkInDate: "2026-05-20",
    checkOutDate: "2026-05-26",
    customerName: "David Wilson",
    customerPhone: "+1 555-0105",
    status: "CHECKED_IN",
    totalAmount: 1074,
    createdAt: "2026-05-14T16:30:00Z",
  },
  {
    id: "b-6",
    roomId: "r-305",
    checkInDate: "2026-05-21",
    checkOutDate: "2026-05-24",
    customerName: "Jennifer Taylor",
    customerPhone: "+1 555-0106",
    status: "CHECKED_IN",
    totalAmount: 537,
    createdAt: "2026-05-17T08:00:00Z",
  },
  {
    id: "b-7",
    roomId: "r-402",
    checkInDate: "2026-05-18",
    checkOutDate: "2026-05-25",
    customerName: "Robert Anderson",
    customerPhone: "+1 555-0107",
    status: "CHECKED_IN",
    totalAmount: 2093,
    createdAt: "2026-05-12T13:15:00Z",
  },
  {
    id: "b-8",
    roomId: "r-405",
    checkInDate: "2026-05-22",
    checkOutDate: "2026-05-27",
    customerName: "Lisa Martinez",
    customerPhone: "+1 555-0108",
    status: "CHECKED_IN",
    totalAmount: 1495,
    createdAt: "2026-05-20T10:00:00Z",
  },
  {
    id: "b-9",
    roomId: "r-101",
    checkInDate: "2026-05-25",
    checkOutDate: "2026-05-28",
    customerName: "James Garcia",
    customerPhone: "+1 555-0109",
    status: "CONFIRMED",
    totalAmount: 297,
    createdAt: "2026-05-21T15:30:00Z",
  },
  {
    id: "b-10",
    roomId: "r-203",
    checkInDate: "2026-05-26",
    checkOutDate: "2026-05-30",
    customerName: "Patricia Thompson",
    customerPhone: "+1 555-0110",
    status: "PENDING",
    totalAmount: 716,
    createdAt: "2026-05-22T09:45:00Z",
  },
];

// Services
export const services: Service[] = [
  { id: "s-1", name: "Room Service - Breakfast", price: 25, category: "FOOD" },
  { id: "s-2", name: "Room Service - Lunch", price: 35, category: "FOOD" },
  { id: "s-3", name: "Room Service - Dinner", price: 45, category: "FOOD" },
  { id: "s-4", name: "Mini Bar Restock", price: 50, category: "FOOD" },
  { id: "s-5", name: "Spa - Full Body Massage", price: 120, category: "SPA" },
  { id: "s-6", name: "Spa - Facial Treatment", price: 80, category: "SPA" },
  { id: "s-7", name: "Laundry - Standard", price: 15, category: "LAUNDRY" },
  { id: "s-8", name: "Laundry - Express", price: 30, category: "LAUNDRY" },
  { id: "s-9", name: "Airport Transfer", price: 60, category: "TRANSPORT" },
  { id: "s-10", name: "City Tour", price: 100, category: "TRANSPORT" },
];

// Invoices
export const invoices: Invoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2026-001",
    bookingId: "b-7",
    totalAmount: 2093,
    tax: 188.37,
    discount: 100,
    createdAt: "2026-05-18T14:00:00Z",
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-2026-002",
    bookingId: "b-5",
    totalAmount: 1074,
    tax: 96.66,
    discount: 0,
    createdAt: "2026-05-20T10:00:00Z",
  },
];

// Staff/Users
export const users: User[] = [
  { id: "u-1", name: "Carlos Rodriguez", email: "carlos@hotel.com", role: "MAINTENANCE" },
  { id: "u-2", name: "Maria Santos", email: "maria@hotel.com", role: "MAINTENANCE" },
  { id: "u-3", name: "James Wilson", email: "james@hotel.com", role: "MAINTENANCE" },
  { id: "u-4", name: "Anna Chen", email: "anna@hotel.com", role: "HOUSEKEEPING" },
  { id: "u-5", name: "Robert Brown", email: "robert@hotel.com", role: "STAFF" },
  { id: "u-6", name: "Admin User", email: "admin@hotel.com", role: "ADMIN" },
];

// Maintenance Records
export const maintenanceRecords: MaintenanceRecord[] = [
  {
    id: "mr-1",
    roomId: "r-106",
    description: "AC unit not cooling properly - compressor replacement needed",
    startDate: "2026-05-18",
    repairCost: 450.00,
    status: "IN_PROGRESS",
    staffId: "u-1",
  },
  {
    id: "mr-2",
    roomId: "r-306",
    description: "Bathroom sink leak - pipe replacement",
    startDate: "2026-05-19",
    repairCost: 180.50,
    status: "IN_PROGRESS",
    staffId: "u-2",
  },
  {
    id: "mr-3",
    roomId: "r-203",
    description: "TV remote control replacement",
    startDate: "2026-05-15",
    endDate: "2026-05-15",
    repairCost: 25.00,
    status: "COMPLETED",
    staffId: "u-3",
  },
  {
    id: "mr-4",
    roomId: "r-401",
    description: "Mini bar refrigerator repair - thermostat issue",
    startDate: "2026-05-16",
    endDate: "2026-05-17",
    repairCost: 120.00,
    status: "COMPLETED",
    staffId: "u-1",
  },
  {
    id: "mr-5",
    roomId: "r-102",
    description: "Door lock mechanism replacement",
    startDate: "2026-05-14",
    endDate: "2026-05-14",
    repairCost: 275.00,
    status: "COMPLETED",
    staffId: "u-2",
  },
  {
    id: "mr-6",
    roomId: "r-305",
    description: "Balcony door alignment and seal replacement",
    startDate: "2026-05-12",
    endDate: "2026-05-13",
    repairCost: 150.00,
    status: "COMPLETED",
    staffId: "u-3",
  },
];

// Amenities
export const amenities: Amenity[] = [
  { id: "a-1", name: "WiFi", icon: "Wifi", category: "COMFORT" },
  { id: "a-2", name: "TV", icon: "Tv", category: "ENTERTAINMENT" },
  { id: "a-3", name: "Air Conditioning", icon: "Wind", category: "COMFORT" },
  { id: "a-4", name: "Mini Bar", icon: "Wine", category: "KITCHEN" },
  { id: "a-5", name: "Balcony", icon: "Fence", category: "OUTDOOR" },
  { id: "a-6", name: "Room Service", icon: "UtensilsCrossed", category: "COMFORT" },
  { id: "a-7", name: "Living Room", icon: "Sofa", category: "COMFORT" },
  { id: "a-8", name: "Jacuzzi", icon: "Bath", category: "BATHROOM" },
  { id: "a-9", name: "Safe Box", icon: "Lock", category: "COMFORT" },
  { id: "a-10", name: "Coffee Maker", icon: "Coffee", category: "KITCHEN" },
  { id: "a-11", name: "Hair Dryer", icon: "Wind", category: "BATHROOM" },
  { id: "a-12", name: "Iron", icon: "Shirt", category: "COMFORT" },
];

// Guests linked to bookings
export const guests: Guest[] = [
  // Booking b-1 (Room 102 - John Smith)
  { id: "g-1", bookingId: "b-1", name: "John Smith", idType: "PASSPORT", idNumber: "US12345678", phone: "+1 555-0101", isPrimary: true },
  { id: "g-2", bookingId: "b-1", name: "Mary Smith", idType: "PASSPORT", idNumber: "US12345679", phone: "+1 555-0111", isPrimary: false },
  // Booking b-2 (Room 105 - Emily Johnson)
  { id: "g-3", bookingId: "b-2", name: "Emily Johnson", idType: "ID_CARD", idNumber: "NY-9876543", phone: "+1 555-0102", isPrimary: true },
  // Booking b-3 (Room 202 - Michael Brown)
  { id: "g-4", bookingId: "b-3", name: "Michael Brown", idType: "DRIVER_LICENSE", idNumber: "DL-456789", phone: "+1 555-0103", isPrimary: true },
  { id: "g-5", bookingId: "b-3", name: "Linda Brown", idType: "DRIVER_LICENSE", idNumber: "DL-456790", phone: "+1 555-0113", isPrimary: false },
  { id: "g-6", bookingId: "b-3", name: "Tommy Brown", idType: "ID_CARD", idNumber: "NY-1234567", phone: "+1 555-0123", isPrimary: false },
  // Booking b-4 (Room 205 - Sarah Davis)
  { id: "g-7", bookingId: "b-4", name: "Sarah Davis", idType: "PASSPORT", idNumber: "UK87654321", phone: "+1 555-0104", isPrimary: true },
  { id: "g-8", bookingId: "b-4", name: "James Davis", idType: "PASSPORT", idNumber: "UK87654322", phone: "+1 555-0114", isPrimary: false },
  // Booking b-5 (Room 301 - David Wilson)
  { id: "g-9", bookingId: "b-5", name: "David Wilson", idType: "PASSPORT", idNumber: "CA55667788", phone: "+1 555-0105", isPrimary: true },
  { id: "g-10", bookingId: "b-5", name: "Susan Wilson", idType: "PASSPORT", idNumber: "CA55667789", phone: "+1 555-0115", isPrimary: false },
  // Booking b-6 (Room 305 - Jennifer Taylor)
  { id: "g-11", bookingId: "b-6", name: "Jennifer Taylor", idType: "ID_CARD", idNumber: "TX-2468135", phone: "+1 555-0106", isPrimary: true },
  // Booking b-7 (Room 402 - Robert Anderson)
  { id: "g-12", bookingId: "b-7", name: "Robert Anderson", idType: "PASSPORT", idNumber: "US99887766", phone: "+1 555-0107", isPrimary: true },
  { id: "g-13", bookingId: "b-7", name: "Karen Anderson", idType: "PASSPORT", idNumber: "US99887767", phone: "+1 555-0117", isPrimary: false },
  { id: "g-14", bookingId: "b-7", name: "Mike Anderson", idType: "PASSPORT", idNumber: "US99887768", phone: "+1 555-0127", isPrimary: false },
  { id: "g-15", bookingId: "b-7", name: "Emily Anderson", idType: "PASSPORT", idNumber: "US99887769", phone: "+1 555-0137", isPrimary: false },
  // Booking b-8 (Room 405 - Lisa Martinez)
  { id: "g-16", bookingId: "b-8", name: "Lisa Martinez", idType: "ID_CARD", idNumber: "CA-1357924", phone: "+1 555-0108", isPrimary: true },
  { id: "g-17", bookingId: "b-8", name: "Carlos Martinez", idType: "ID_CARD", idNumber: "CA-1357925", phone: "+1 555-0118", isPrimary: false },
];

// Helper function to get room with type
export function getRoomWithType(room: Room): RoomWithType {
  const roomType = roomTypes.find((rt) => rt.id === room.roomTypeId)!;
  return { ...room, roomType };
}

// Helper function to get all rooms with types
export function getRoomsWithTypes(): RoomWithType[] {
  return rooms.map(getRoomWithType);
}

// Helper function to get booking with room
export function getBookingWithRoom(booking: Booking): BookingWithRoom {
  const room = rooms.find((r) => r.id === booking.roomId)!;
  return { ...booking, room: getRoomWithType(room) };
}

// Helper function to get all bookings with rooms
export function getBookingsWithRooms(): BookingWithRoom[] {
  return bookings.map(getBookingWithRoom);
}

// Helper function to get maintenance record with details
export function getMaintenanceRecordWithDetails(record: MaintenanceRecord): MaintenanceRecordWithDetails {
  const room = rooms.find((r) => r.id === record.roomId)!;
  const staff = users.find((u) => u.id === record.staffId)!;
  return { ...record, room: getRoomWithType(room), staff };
}

// Helper function to get all maintenance records with details
export function getMaintenanceRecordsWithDetails(): MaintenanceRecordWithDetails[] {
  return maintenanceRecords.map(getMaintenanceRecordWithDetails);
}

// Helper function to get maintenance staff
export function getMaintenanceStaff(): User[] {
  return users.filter((u) => u.role === "MAINTENANCE");
}

// Helper function to get guests by booking ID
export function getGuestsByBookingId(bookingId: string): Guest[] {
  return guests.filter((g) => g.bookingId === bookingId);
}

// Helper function to get booking folio (booking with room and guests)
export function getBookingFolio(bookingId: string): BookingFolio | null {
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return null;
  
  const room = rooms.find((r) => r.id === booking.roomId);
  if (!room) return null;
  
  return {
    ...booking,
    room: getRoomWithType(room),
    guests: getGuestsByBookingId(bookingId),
  };
}

// Helper function to get booking folio by room ID (for occupied rooms)
export function getBookingFolioByRoomId(roomId: string): BookingFolio | null {
  const booking = bookings.find(
    (b) => b.roomId === roomId && b.status === "CHECKED_IN"
  );
  if (!booking) return null;
  return getBookingFolio(booking.id);
}

// Helper function to get available rooms by room type
export function getAvailableRoomsByType(roomTypeId: string, excludeRoomId?: string): RoomWithType[] {
  return rooms
    .filter((r) => r.roomTypeId === roomTypeId && r.status === "AVAILABLE" && r.id !== excludeRoomId)
    .map(getRoomWithType);
}

// Dashboard statistics
export function getDashboardStats() {
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE").length;
  const occupiedRooms = rooms.filter((r) => r.status === "OCCUPIED").length;
  const dirtyRooms = rooms.filter((r) => r.status === "DIRTY").length;
  const maintenanceRooms = rooms.filter((r) => r.status === "MAINTENANCE").length;

  const activeBookings = bookings.filter(
    (b) => b.status === "CHECKED_IN" || b.status === "CONFIRMED"
  );
  const todayRevenue = bookings
    .filter((b) => b.status === "CHECKED_IN")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

  return {
    totalRooms,
    availableRooms,
    occupiedRooms,
    dirtyRooms,
    maintenanceRooms,
    activeBookings: activeBookings.length,
    todayRevenue,
    occupancyRate,
  };
}
