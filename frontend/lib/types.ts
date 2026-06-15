// Room Status Types
export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "DIRTY" | "MAINTENANCE";

// Booking Status Types
export type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

// Service Category Types
export type ServiceCategory = "FOOD" | "SPA" | "LAUNDRY" | "TRANSPORT" | "OTHER";

// Room Type Entity
export interface RoomType {
  id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
}

// Room Entity
export interface Room {
  id: string;
  roomNumber: string;
  status: RoomStatus;
  roomTypeId: string;
  floor: number;
}

// Booking Entity
export interface Booking {
  id: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  customerName: string;
  customerPhone: string;
  status: BookingStatus;
  totalAmount: number;
  createdAt: string;
}

// Service Entity
export interface Service {
  id: string;
  name: string;
  price: number;
  category: ServiceCategory;
}

// Invoice Entity
export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  totalAmount: number;
  tax: number;
  discount: number;
  createdAt: string;
  paidAt?: string;
}

// Maintenance Record Types
export type MaintenanceStatus = "IN_PROGRESS" | "COMPLETED";

export interface MaintenanceRecord {
  id: string;
  roomId: string;
  description: string;
  startDate: string;
  endDate?: string;
  repairCost: number; // BigDecimal format stored as number
  status: MaintenanceStatus;
  staffId: string;
}

// Staff/User Entity
export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF" | "HOUSEKEEPING" | "MAINTENANCE";
}

// Amenity Entity
export interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: "COMFORT" | "ENTERTAINMENT" | "BATHROOM" | "KITCHEN" | "OUTDOOR";
}

// Guest Entity
export interface Guest {
  id: string;
  bookingId: string;
  name: string;
  idType: "PASSPORT" | "ID_CARD" | "DRIVER_LICENSE";
  idNumber: string;
  phone: string;
  isPrimary: boolean;
}

// Extended types for UI
export interface RoomWithType extends Room {
  roomType: RoomType;
}

export interface BookingWithRoom extends Booking {
  room: RoomWithType;
}

export interface MaintenanceRecordWithDetails extends MaintenanceRecord {
  room: RoomWithType;
  staff: User;
}

// Booking Folio with all details
export interface BookingFolio extends Booking {
  room: RoomWithType;
  guests: Guest[];
}
