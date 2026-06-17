import prisma from "../config/prisma";

export const PricingService = {
  /**
   * Tính toán tiền phòng tự động dựa trên thời gian, hình thức thuê và phòng
   */
  calculateRoomCharge: async (
    roomId: string | bigint,
    bookingType: string,
    checkInDate: Date | string,
    checkOutDate: Date | string
  ) => {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new Error("Ngày nhận/trả phòng không hợp lệ");
    }

    if (checkOut <= checkIn) {
      throw new Error("Thời gian trả phòng phải sau thời gian nhận phòng");
    }

    // 1. Tìm thông tin phòng & loại phòng
    const room = await prisma.room.findUnique({
      where: { id: BigInt(roomId) },
      include: { roomType: true }
    });

    if (!room) {
      throw new Error("Không tìm thấy thông tin phòng");
    }

    const rt = room.roomType;

    // Lấy thông tin các mức giá (ưu tiên giá cấu hình riêng của phòng, nếu không lấy giá của loại phòng)
    // Để đơn giản và chính xác như khách sạn lớn, chúng ta mặc định dùng giá loại phòng,
    // nhưng nếu phòng có giá riêng (pricePerNight), ta có thể scale các mức giá theo tỷ lệ hoặc dùng trực tiếp giá loại phòng.
    // Theo yêu cầu của người dùng: "phòng tự cập nhật giá định sẵn về từng loại phòng", ta sẽ sử dụng giá định sẵn trên loại phòng.
    const priceHourly = Number(rt.priceHourly || 0);
    const priceDaily = Number(rt.priceDaily || rt.pricePerNight || 0);
    const priceOvernight = Number(rt.priceOvernight || 0);

    const priceHourlyWeekend = Number(rt.priceHourlyWeekend || priceHourly);
    const priceDailyWeekend = Number(rt.priceDailyWeekend || priceDaily);
    const priceOvernightWeekend = Number(rt.priceOvernightWeekend || priceOvernight);

    const priceHourlyHoliday = Number(rt.priceHourlyHoliday || priceHourly);
    const priceDailyHoliday = Number(rt.priceDailyHoliday || priceDaily);
    const priceOvernightHoliday = Number(rt.priceOvernightHoliday || priceOvernight);

    // 2. Lấy danh sách ngày lễ từ DB
    const holidays = await prisma.holiday.findMany();
    const holidaySet = new Set<string>(
      holidays.map(h => {
        const d = new Date(h.holidayDate);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      })
    );

    // Helper kiểm tra ngày lễ (local date string YYYY-MM-DD)
    const isHoliday = (date: Date) => {
      const str = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return holidaySet.has(str);
    };

    // Helper kiểm tra cuối tuần (Thứ 7 hoặc Chủ Nhật)
    const isWeekend = (date: Date) => {
      const day = date.getDay(); // 0: Chủ Nhật, 6: Thứ Bảy
      return day === 0 || day === 6;
    };

    let subTotal = 0;
    const details: Array<{ date: string; rateType: string; amount: number }> = [];

    // 3. Tính tiền theo hình thức ở
    if (bookingType === "HOURLY") {
      // Tính số giờ thuê (làm tròn lên)
      const diffMs = checkOut.getTime() - checkIn.getTime();
      let hours = Math.ceil(diffMs / (1000 * 60 * 60));
      if (hours <= 0) hours = 1;

      // Xác định mức giá giờ áp dụng cho ngày nhận phòng
      let rate = priceHourly;
      let rateType = "Giờ ngày thường";

      if (isHoliday(checkIn)) {
        rate = priceHourlyHoliday;
        rateType = "Giờ ngày lễ";
      } else if (isWeekend(checkIn)) {
        rate = priceHourlyWeekend;
        rateType = "Giờ cuối tuần";
      }

      subTotal = rate * hours;
      details.push({
        date: `${hours} giờ (từ ${checkIn.getHours()}h-${checkOut.getHours()}h ngày ${checkIn.getDate()}/${checkIn.getMonth() + 1})`,
        rateType,
        amount: subTotal
      });
    } else {
      // Đối với DAILY hoặc OVERNIGHT: Tính tiền theo từng đêm lưu trú
      // Duyệt qua mỗi đêm: một đêm tính từ check-in đến ngày hôm sau
      const currentDate = new Date(checkIn);
      // Đặt giờ về 0 để so sánh ngày dễ dàng
      const endCompareDate = new Date(checkOut);
      
      // Số đêm thực tế
      const timeDiff = checkOut.getTime() - checkIn.getTime();
      let nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      if (nights <= 0) nights = 1;

      for (let i = 0; i < nights; i++) {
        const nightDate = new Date(currentDate);
        nightDate.setDate(currentDate.getDate() + i);

        const dateStr = `${nightDate.getDate()}/${nightDate.getMonth() + 1}/${nightDate.getFullYear()}`;
        let rate = 0;
        let rateType = "";

        if (bookingType === "OVERNIGHT") {
          rateType = "Đêm ngày thường";
          rate = priceOvernight;
          if (isHoliday(nightDate)) {
            rateType = "Đêm ngày lễ";
            rate = priceOvernightHoliday;
          } else if (isWeekend(nightDate)) {
            rateType = "Đêm cuối tuần";
            rate = priceOvernightWeekend;
          }
        } else {
          // DAILY (mặc định)
          rateType = "Ngày ngày thường";
          rate = priceDaily;
          if (isHoliday(nightDate)) {
            rateType = "Ngày ngày lễ";
            rate = priceDailyHoliday;
          } else if (isWeekend(nightDate)) {
            rateType = "Ngày cuối tuần";
            rate = priceDailyWeekend;
          }
        }

        subTotal += rate;
        details.push({
          date: `Đêm ${dateStr}`,
          rateType,
          amount: rate
        });
      }
    }

    const taxAmount = 0;
    const totalAmount = subTotal;

    return {
      subTotal,
      taxAmount,
      totalAmount,
      details,
      bookingType,
      roomNumber: room.roomNumber,
      roomTypeName: rt.name
    };
  }
};
