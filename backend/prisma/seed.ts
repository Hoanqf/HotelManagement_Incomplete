import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Room Type & Price Seeding...");

  // 1. Seed Holidays
  const holidaysData = [
    { name: "Tết Dương Lịch", date: "2026-01-01" },
    { name: "Giải phóng Miền Nam", date: "2026-04-30" },
    { name: "Quốc tế Lao động", date: "2026-05-01" },
    { name: "Quốc khánh", date: "2026-09-02" },
  ];

  for (const h of holidaysData) {
    const holidayDate = new Date(h.date);
    await prisma.holiday.upsert({
      where: { holidayDate },
      update: {},
      create: {
        name: h.name,
        holidayDate,
      },
    });
  }
  console.log("Holidays seeded.");

  // 2. Define the fixed 3 Room Types and their base rates
  const fixedRoomTypes = [
    {
      name: "Standard",
      pricePerNight: 600000,
      capacity: 2,
      description: "Phòng tiêu chuẩn ấm cúng, đầy đủ tiện nghi.",
      amenities: ["WiFi", "TV", "Air Conditioning"],
    },
    {
      name: "Deluxe",
      pricePerNight: 1000000,
      capacity: 3,
      description: "Phòng sang trọng với ban công rộng rãi và trang thiết bị hiện đại.",
      amenities: ["WiFi", "TV", "Air Conditioning", "Balcony", "Mini Bar"],
    },
    {
      name: "Suite",
      pricePerNight: 1500000,
      capacity: 4,
      description: "Phòng thượng hạng cao cấp nhất với phòng khách riêng biệt.",
      amenities: ["WiFi", "TV", "Air Conditioning", "Balcony", "Mini Bar", "Living Room", "Jacuzzi", "Room Service"],
    },
  ];

  const createdRoomTypeIds: string[] = [];

  for (const rt of fixedRoomTypes) {
    // Check if room type with this name already exists
    let existing = await prisma.roomType.findFirst({
      where: { name: rt.name }
    });

    const daily = rt.pricePerNight;
    const hourly = Math.round(daily / 10);
    const overnight = Math.round(daily * 0.7);

    // Weekend rates: +15%
    const hourlyWeekend = Math.round(hourly * 1.15);
    const dailyWeekend = Math.round(daily * 1.15);
    const overnightWeekend = Math.round(overnight * 1.15);

    // Holiday rates: +30%
    const hourlyHoliday = Math.round(hourly * 1.3);
    const dailyHoliday = Math.round(daily * 1.3);
    const overnightHoliday = Math.round(overnight * 1.3);

    const dataPayload = {
      name: rt.name,
      pricePerNight: daily,
      capacity: rt.capacity,
      description: rt.description,
      amenities: rt.amenities,
      priceHourly: hourly,
      priceDaily: daily,
      priceOvernight: overnight,
      priceHourlyWeekend: hourlyWeekend,
      priceDailyWeekend: dailyWeekend,
      priceOvernightWeekend: overnightWeekend,
      priceHourlyHoliday: hourlyHoliday,
      priceDailyHoliday: dailyHoliday,
      priceOvernightHoliday: overnightHoliday,
    };

    if (existing) {
      existing = await prisma.roomType.update({
        where: { id: existing.id },
        data: dataPayload,
      });
      console.log(`Updated room type: ${rt.name}`);
    } else {
      existing = await prisma.roomType.create({
        data: dataPayload,
      });
      console.log(`Created room type: ${rt.name}`);
    }
    createdRoomTypeIds.push(existing.id.toString());
  }

  // 3. Re-assign existing rooms to the new fixed room types and clean up old ones
  const allRooms = await prisma.room.findMany({
    include: { roomType: true }
  });

  const standardType = await prisma.roomType.findFirst({ where: { name: "Standard" } });
  const deluxeType = await prisma.roomType.findFirst({ where: { name: "Deluxe" } });
  const suiteType = await prisma.roomType.findFirst({ where: { name: "Suite" } });

  if (standardType && deluxeType && suiteType) {
    for (const r of allRooms) {
      const currentTypeName = r.roomType?.name || "";
      if (!["Standard", "Deluxe", "Suite"].includes(currentTypeName)) {
        // Map old types to one of standard, deluxe, suite based on price
        let targetType = standardType;
        const price = Number(r.pricePerNight || r.roomType?.pricePerNight || 0);
        if (price >= 1300000) {
          targetType = suiteType;
        } else if (price >= 800000) {
          targetType = deluxeType;
        }

        await prisma.room.update({
          where: { id: r.id },
          data: {
            roomTypeId: targetType.id,
            pricePerNight: targetType.pricePerNight,
            capacity: targetType.capacity,
          }
        });
        console.log(`Re-assigned room ${r.roomNumber} to ${targetType.name}`);
      } else {
        // Ensure price & capacity align with the type definition
        const targetType = currentTypeName === "Standard" ? standardType : currentTypeName === "Deluxe" ? deluxeType : suiteType;
        await prisma.room.update({
          where: { id: r.id },
          data: {
            pricePerNight: targetType.pricePerNight,
            capacity: targetType.capacity,
          }
        });
      }
    }

    // Clean up other room types that are not Standard, Deluxe, Suite
    const deletedTypes = await prisma.roomType.deleteMany({
      where: {
        NOT: {
          id: {
            in: [standardType.id, deluxeType.id, suiteType.id]
          }
        }
      }
    });
    console.log(`Cleaned up ${deletedTypes.count} legacy room types.`);
  }

  // 4. Create or update SUPERADMIN account
  const passwordHash = await bcrypt.hash("123", 10);
  const superadminExist = await prisma.user.findFirst({
    where: {
      OR: [
        { usercode: "superadmin" },
        { role: "SUPERADMIN" }
      ]
    }
  });

  if (superadminExist) {
    await prisma.user.update({
      where: { id: superadminExist.id },
      data: {
        usercode: "superadmin",
        email: "superadmin@gmail.com",
        password: passwordHash,
        role: "SUPERADMIN",
        status: "ACTIVE"
      }
    });
    console.log("Updated SUPERADMIN user credentials to username: 'superadmin', password: '123', email: 'superadmin@gmail.com'");
  } else {
    await prisma.user.create({
      data: {
        usercode: "superadmin",
        fullName: "Hệ thống Super Admin",
        email: "superadmin@gmail.com",
        password: passwordHash,
        phoneNumber: "0999999999",
        role: "SUPERADMIN",
        status: "ACTIVE"
      }
    });
    console.log("Created SUPERADMIN user: 'superadmin' / password: '123' / email: 'superadmin@gmail.com'");
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
