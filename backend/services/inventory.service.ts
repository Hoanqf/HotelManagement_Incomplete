import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

// Helper to serialize BigInt and Decimal safe for JSON
const serializeItem = (item: any) => {
  if (!item) return null;
  return {
    ...item,
    id: item.id.toString(),
    costPrice: Number(item.costPrice),
    sellingPrice: item.sellingPrice ? Number(item.sellingPrice) : null,
  };
};

const serializeTransaction = (tx: any) => {
  if (!tx) return null;
  return {
    ...tx,
    id: tx.id.toString(),
    itemId: tx.itemId.toString(),
    price: Number(tx.price),
    totalAmount: Number(tx.totalAmount),
    createdById: tx.createdById ? tx.createdById.toString() : null,
    item: tx.item ? serializeItem(tx.item) : undefined,
  };
};

export const InventoryService = {
  // 1. Lấy danh sách sản phẩm kho (Tự động seed nếu trống)
  getAllItems: async () => {
    let items = await prisma.inventoryItem.findMany({
      orderBy: { name: "asc" }
    });

    if (items.length === 0) {
      const defaultItems = [
        { name: "Bàn chải & Kem đánh răng", sku: "AMN-BRUSH", category: "Tiện ích phòng", unit: "Bộ", quantity: 150, minQuantity: 50, costPrice: new Prisma.Decimal(3000), sellingPrice: new Prisma.Decimal(0) },
        { name: "Dầu gội & Sữa tắm mini", sku: "AMN-SHAMP", category: "Tiện ích phòng", unit: "Chai", quantity: 200, minQuantity: 50, costPrice: new Prisma.Decimal(4000), sellingPrice: new Prisma.Decimal(0) },
        { name: "Khăn tắm trắng 60x120", sku: "LIN-TOWEL", category: "Đồ giặt là & Vải", unit: "Cái", quantity: 80, minQuantity: 20, costPrice: new Prisma.Decimal(45000), sellingPrice: new Prisma.Decimal(0) },
        { name: "Nước khoáng La Vie 500ml", sku: "BEV-LAVIE", category: "Đồ uống & Đồ ăn nhẹ", unit: "Chai", quantity: 120, minQuantity: 30, costPrice: new Prisma.Decimal(4000), sellingPrice: new Prisma.Decimal(10000) },
        { name: "Coca Cola lon 320ml", sku: "BEV-COCA", category: "Đồ uống & Đồ ăn nhẹ", unit: "Lon", quantity: 100, minQuantity: 24, costPrice: new Prisma.Decimal(7000), sellingPrice: new Prisma.Decimal(15000) },
        { name: "Bia Heineken lon 330ml", sku: "BEV-KEN", category: "Đồ uống & Đồ ăn nhẹ", unit: "Lon", quantity: 60, minQuantity: 24, costPrice: new Prisma.Decimal(16000), sellingPrice: new Prisma.Decimal(25000) },
        { name: "Nước lau sàn Sunlight 1L", sku: "CLN-FLOOR", category: "Dụng cụ dọn dẹp", unit: "Chai", quantity: 15, minQuantity: 5, costPrice: new Prisma.Decimal(28000), sellingPrice: new Prisma.Decimal(0) }
      ];

      await prisma.inventoryItem.createMany({
        data: defaultItems
      });

      items = await prisma.inventoryItem.findMany({
        orderBy: { name: "asc" }
      });
    }

    return items.map(serializeItem);
  },

  // 2. Tạo sản phẩm kho mới
  createItem: async (data: {
    name: string;
    sku?: string;
    category: string;
    unit: string;
    quantity?: number;
    minQuantity?: number;
    costPrice?: number;
    sellingPrice?: number;
    description?: string;
  }) => {
    const { name, sku, category, unit, quantity, minQuantity, costPrice, sellingPrice, description } = data;

    // Check unique SKU
    if (sku) {
      const existing = await prisma.inventoryItem.findUnique({
        where: { sku }
      });
      if (existing) {
        throw new Error(`Mã SKU "${sku}" đã tồn tại trên hệ thống.`);
      }
    }

    const newItem = await prisma.inventoryItem.create({
      data: {
        name,
        sku: sku || null,
        category,
        unit,
        quantity: quantity || 0,
        minQuantity: minQuantity || 0,
        costPrice: new Prisma.Decimal(costPrice || 0),
        sellingPrice: sellingPrice ? new Prisma.Decimal(sellingPrice) : null,
        description: description || null
      }
    });

    return serializeItem(newItem);
  },

  // 3. Cập nhật sản phẩm kho
  updateItem: async (id: string, data: any) => {
    const cleanId = BigInt(id);
    const { name, sku, category, unit, minQuantity, costPrice, sellingPrice, description } = data;

    if (sku) {
      const existing = await prisma.inventoryItem.findFirst({
        where: {
          sku,
          NOT: { id: cleanId }
        }
      });
      if (existing) {
        throw new Error(`Mã SKU "${sku}" đã tồn tại trên sản phẩm khác.`);
      }
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: cleanId },
      data: {
        name,
        sku: sku !== undefined ? (sku || null) : undefined,
        category,
        unit,
        minQuantity: minQuantity !== undefined ? Number(minQuantity) : undefined,
        costPrice: costPrice !== undefined ? new Prisma.Decimal(Number(costPrice)) : undefined,
        sellingPrice: sellingPrice !== undefined ? (sellingPrice !== null ? new Prisma.Decimal(Number(sellingPrice)) : null) : undefined,
        description: description !== undefined ? (description || null) : undefined
      }
    });

    return serializeItem(updated);
  },

  // 4. Xóa sản phẩm kho
  deleteItem: async (id: string) => {
    const cleanId = BigInt(id);
    const deleted = await prisma.inventoryItem.delete({
      where: { id: cleanId }
    });
    return serializeItem(deleted);
  },

  // 5. Xem lịch sử giao dịch kho (Nhập/Xuất)
  getAllTransactions: async (filters: {
    type?: string;
    itemId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const { type, itemId, startDate, endDate } = filters;
    const whereClause: any = {};

    if (type) {
      whereClause.type = type;
    }
    if (itemId) {
      whereClause.itemId = BigInt(itemId);
    }
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where: whereClause,
      include: {
        item: true
      },
      orderBy: {
        date: "desc"
      }
    });

    return transactions.map(serializeTransaction);
  },

  // 6. Nhập kho (IMPORT)
  importStock: async (data: {
    itemId: string;
    quantity: number;
    price: number;
    reason?: string;
    referenceId?: string;
    createdById?: string;
  }) => {
    const { itemId, quantity, price, reason, referenceId, createdById } = data;
    const cleanItemId = BigInt(itemId);

    if (quantity <= 0) {
      throw new Error("Số lượng nhập kho phải lớn hơn 0.");
    }
    if (price < 0) {
      throw new Error("Đơn giá nhập kho không được âm.");
    }

    // 1. Thao tác trong transaction để đảm bảo tính toàn vẹn
    const result = await prisma.$transaction(async (tx) => {
      // Lấy sản phẩm hiện tại
      const item = await tx.inventoryItem.findUnique({
        where: { id: cleanItemId }
      });
      if (!item) {
        throw new Error("Không tìm thấy sản phẩm cần nhập kho.");
      }

      // Cộng tồn kho
      const updatedItem = await tx.inventoryItem.update({
        where: { id: cleanItemId },
        data: {
          quantity: item.quantity + quantity
        }
      });

      // Tạo bản ghi giao dịch kho
      const totalAmount = new Prisma.Decimal(quantity * price);
      const invTx = await tx.inventoryTransaction.create({
        data: {
          type: "IMPORT",
          itemId: cleanItemId,
          quantity,
          price: new Prisma.Decimal(price),
          totalAmount,
          reason: reason || "Nhập hàng định kỳ",
          referenceId: referenceId || null,
          createdById: createdById ? BigInt(createdById) : null
        },
        include: {
          item: true
        }
      });

      // 2. Tích hợp Tài chính: Tạo EXPENSE giao dịch thu chi tự động
      const today = new Date();
      const dateStr = today.getFullYear().toString() +
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0');
      const rand = Math.floor(1000 + Math.random() * 9000);
      const financeTxCode = `INV-IMP-${invTx.id.toString()}-${dateStr}-${rand}`;

      // Tìm người tạo mặc định (hoặc người thực hiện)
      let creatorId = createdById ? BigInt(createdById) : null;
      if (!creatorId) {
        const defaultAdmin = await tx.user.findFirst({
          where: { role: "ADMIN" },
          orderBy: { id: "asc" }
        });
        creatorId = defaultAdmin ? defaultAdmin.id : BigInt(1);
      }

      await tx.financeTransaction.create({
        data: {
          code: financeTxCode,
          type: "EXPENSE",
          category: "Vật tư",
          amount: totalAmount,
          description: `[Nhập kho] Nhập sản phẩm: ${item.name} (SL: ${quantity} ${item.unit}) - Lý do: ${reason || "Nhập hàng định kỳ"}`,
          date: new Date(),
          createdById: creatorId
        }
      });

      return invTx;
    });

    return serializeTransaction(result);
  },

  // 7. Xuất kho (EXPORT)
  exportStock: async (data: {
    itemId: string;
    quantity: number;
    reason?: string;
    referenceId?: string;
    createdById?: string;
  }) => {
    const { itemId, quantity, reason, referenceId, createdById } = data;
    const cleanItemId = BigInt(itemId);

    if (quantity <= 0) {
      throw new Error("Số lượng xuất kho phải lớn hơn 0.");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Lấy sản phẩm hiện tại
      const item = await tx.inventoryItem.findUnique({
        where: { id: cleanItemId }
      });
      if (!item) {
        throw new Error("Không tìm thấy sản phẩm cần xuất kho.");
      }

      // Kiểm tra xem số lượng tồn kho có đủ để xuất không
      if (item.quantity < quantity) {
        throw new Error(`Số lượng tồn kho không đủ để xuất. Hiện tại chỉ còn ${item.quantity} ${item.unit}.`);
      }

      // Trừ tồn kho
      await tx.inventoryItem.update({
        where: { id: cleanItemId },
        data: {
          quantity: item.quantity - quantity
        }
      });

      // Tạo bản ghi giao dịch kho
      // Giá xuất kho mặc định bằng giá vốn hiện tại costPrice
      const price = item.costPrice;
      const totalAmount = new Prisma.Decimal(quantity * Number(price));

      const invTx = await tx.inventoryTransaction.create({
        data: {
          type: "EXPORT",
          itemId: cleanItemId,
          quantity,
          price,
          totalAmount,
          reason: reason || "Cung cấp buồng phòng",
          referenceId: referenceId || null,
          createdById: createdById ? BigInt(createdById) : null
        },
        include: {
          item: true
        }
      });

      return invTx;
    });

    return serializeTransaction(result);
  }
};
