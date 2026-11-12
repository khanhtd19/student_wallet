
const fs = require('fs/promises');
const path = require('path');
const db = require('../config/database');

const BACKUP_APP = 'Student Wallet';
const BACKUP_VERSION = 1;

function fail(message) {
  throw new Error(message);
}

function validId(value) {
  return /^\d+$/.test(String(value)) && BigInt(value) > 0n;
}

function validText(value, max, field) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
    fail(`${field} không hợp lệ.`);
  }
  return value.trim();
}

function validNullableText(value, max, field) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.length > max) {
    fail(`${field} không hợp lệ.`);
  }
  return value;
}

function validAmount(value, allowZero = false) {
  const amount = String(value);

  if (!/^\d{1,12}(\.\d{1,2})?$/.test(amount)) {
    fail('Số tiền không hợp lệ.');
  }

  const number = Number(amount);

  if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
    fail('Số tiền không hợp lệ.');
  }

  return amount;
}

function validDate(value, field, nullable = false) {
  if (nullable && (value == null || value === '')) return null;

  if (typeof value !== 'string') {
    fail(`${field} không hợp lệ.`);
  }

  // Giữ nguyên ngày dạng YYYY-MM-DD.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    if (date.toISOString().slice(0, 10) !== value) {
      fail(`${field} không hợp lệ.`);
    }
    return value;
  }

  // Chuyển timestamp về ngày Việt Nam.
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    fail(`${field} không hợp lệ.`);
  }

  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type).value;

  return `${get('year')}-${get('month')}-${get('day')}`;
}

function validTimestamp(value, field) {
  if (value == null) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    fail(`${field} không hợp lệ.`);
  }

  return date.toISOString();
}

function validateBackup(backup) {
  if (
    !backup ||
    backup.app !== BACKUP_APP ||
    backup.version !== BACKUP_VERSION ||
    !backup.data
  ) {
    fail('File không phải bản sao lưu Student Wallet hợp lệ.');
  }

  const data = backup.data;
  const arrays = ['categories', 'transactions', 'budgets', 'savingsGoals'];

  for (const key of arrays) {
    if (!Array.isArray(data[key]) || data[key].length > 10000) {
      fail(`Dữ liệu ${key} không hợp lệ hoặc vượt giới hạn.`);
    }
  }

  const categoryIds = new Set();

  for (const item of data.categories) {
    if (!validId(item.id) || categoryIds.has(String(item.id))) {
      fail('ID danh mục không hợp lệ hoặc bị trùng.');
    }

    categoryIds.add(String(item.id));

    validText(item.name, 100, 'Tên danh mục');

    if (!['EXPENSE', 'INCOME'].includes(item.type)) {
      fail('Loại danh mục không hợp lệ.');
    }

    validText(item.icon || 'bi-tag', 40, 'Icon');
    validText(item.color || '#64748b', 20, 'Màu danh mục');
  }

  for (const item of data.transactions) {
    if (!validId(item.id) || !validId(item.category_id)) {
      fail('ID giao dịch hoặc danh mục không hợp lệ.');
    }

    const category = data.categories.find(
      (entry) => String(entry.id) === String(item.category_id)
    );

    if (!category || category.type !== item.type) {
      fail('Giao dịch tham chiếu danh mục không hợp lệ.');
    }

    if (!['EXPENSE', 'INCOME'].includes(item.type)) {
      fail('Loại giao dịch không hợp lệ.');
    }

    validText(item.title, 180, 'Tên giao dịch');
    validAmount(item.amount);
    validDate(item.transaction_date, 'Ngày giao dịch');

    if (!['CASH', 'BANK_TRANSFER', 'E_WALLET', 'CARD', 'OTHER'].includes(item.payment_method)) {
      fail('Phương thức thanh toán không hợp lệ.');
    }

    validNullableText(item.merchant, 160, 'Địa điểm giao dịch');
  }

  for (const item of data.budgets) {
    if (!validId(item.id)) fail('ID ngân sách không hợp lệ.');

    if (item.category_id != null) {
      const category = data.categories.find(
        (entry) => String(entry.id) === String(item.category_id)
      );

      if (!category || category.type !== 'EXPENSE') {
        fail('Danh mục ngân sách không hợp lệ.');
      }
    }

    const month = validDate(item.month, 'Tháng ngân sách');

    if (new Date(`${month}T00:00:00Z`).getUTCDate() !== 1) {
      fail('Tháng ngân sách phải bắt đầu từ ngày 1.');
    }

    validAmount(item.amount);
  }

  for (const item of data.savingsGoals) {
    if (!validId(item.id)) fail('ID mục tiêu tiết kiệm không hợp lệ.');

    validText(item.title, 160, 'Tên mục tiêu');
    validAmount(item.target_amount);
    validAmount(item.current_amount, true);
    validDate(item.target_date, 'Ngày mục tiêu', true);

    if (!['ACTIVE', 'COMPLETED', 'PAUSED'].includes(item.status)) {
      fail('Trạng thái mục tiêu tiết kiệm không hợp lệ.');
    }
  }

  return data;
}

async function createCurrentBackup(client, userId) {
  const [categories, transactions, budgets, savingsGoals] = await Promise.all([
    client.query(
      `SELECT id, name, type, icon, color, is_active, is_default, created_at
       FROM categories WHERE user_id = $1 ORDER BY id`,
      [userId]
    ),
    client.query(
      `SELECT id, category_id, type, title, amount, transaction_date,
              payment_method, merchant, note, created_at, updated_at
       FROM transactions WHERE user_id = $1 ORDER BY id`,
      [userId]
    ),
    client.query(
      `SELECT id, category_id, month, amount, created_at, updated_at
       FROM budgets WHERE user_id = $1 ORDER BY id`,
      [userId]
    ),
    client.query(
      `SELECT id, title, target_amount, current_amount, target_date,
              note, status, created_at, updated_at
       FROM savings_goals WHERE user_id = $1 ORDER BY id`,
      [userId]
    )
  ]);

  const backup = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      categories: categories.rows,
      transactions: transactions.rows,
      budgets: budgets.rows,
      savingsGoals: savingsGoals.rows
    }
  };

  const directory = path.join(process.cwd(), 'backups');
  await fs.mkdir(directory, { recursive: true });

  const filename =
    `before_restore_user_${userId}_${Date.now()}.json`;

  const filepath = path.join(directory, filename);

  await fs.writeFile(filepath, JSON.stringify(backup, null, 2), {
    encoding: 'utf8',
    flag: 'wx'
  });

  return filename;
}

async function restore(userId, backup) {
  const data = validateBackup(backup);

  return db.transaction(async (client) => {
    // Sao lưu dữ liệu hiện tại trước khi thay thế.
    const safetyBackup = await createCurrentBackup(client, userId);

    // Xóa dữ liệu cũ theo thứ tự an toàn.
    await client.query('DELETE FROM transactions WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM budgets WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM savings_goals WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM categories WHERE user_id = $1', [userId]);

    // Tạo danh mục mới và ánh xạ ID cũ sang ID mới.
    const categoryMap = new Map();

    for (const item of data.categories) {
      const result = await client.query(
        `INSERT INTO categories
          (user_id, name, type, icon, color, is_active, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id`,
        [
          userId,
          item.name.trim(),
          item.type,
          item.icon || 'bi-tag',
          item.color || '#64748b',
          item.is_active !== false,
          item.is_default === true
        ]
      );

      categoryMap.set(String(item.id), result.rows[0].id);
    }

    // Khôi phục giao dịch.
    for (const item of data.transactions) {
      await client.query(
        `INSERT INTO transactions
          (user_id, category_id, type, title, amount, transaction_date,
           payment_method, merchant, note, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,
                 COALESCE($10::timestamptz,NOW()),
                 COALESCE($11::timestamptz,NOW()))`,
        [
          userId,
          categoryMap.get(String(item.category_id)),
          item.type,
          item.title.trim(),
          validAmount(item.amount),
          validDate(item.transaction_date, 'Ngày giao dịch'),
          item.payment_method,
          item.merchant || null,
          item.note || null,
          validTimestamp(item.created_at, 'Thời gian tạo'),
          validTimestamp(item.updated_at, 'Thời gian cập nhật')
        ]
      );
    }

    // Khôi phục ngân sách.
    for (const item of data.budgets) {
      await client.query(
        `INSERT INTO budgets
          (user_id, category_id, month, amount, created_at, updated_at)
         VALUES ($1,$2,$3,$4,
                 COALESCE($5::timestamptz,NOW()),
                 COALESCE($6::timestamptz,NOW()))`,
        [
          userId,
          item.category_id == null
            ? null
            : categoryMap.get(String(item.category_id)),
          validDate(item.month, 'Tháng ngân sách'),
          validAmount(item.amount),
          validTimestamp(item.created_at, 'Thời gian tạo'),
          validTimestamp(item.updated_at, 'Thời gian cập nhật')
        ]
      );
    }

    // Khôi phục mục tiêu tiết kiệm.
    for (const item of data.savingsGoals) {
      await client.query(
        `INSERT INTO savings_goals
          (user_id, title, target_amount, current_amount, target_date,
           note, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,
                 COALESCE($8::timestamptz,NOW()),
                 COALESCE($9::timestamptz,NOW()))`,
        [
          userId,
          item.title.trim(),
          validAmount(item.target_amount),
          validAmount(item.current_amount, true),
          validDate(item.target_date, 'Ngày mục tiêu', true),
          item.note || null,
          item.status,
          validTimestamp(item.created_at, 'Thời gian tạo'),
          validTimestamp(item.updated_at, 'Thời gian cập nhật')
        ]
      );
    }

    return {
      safetyBackup,
      categories: data.categories.length,
      transactions: data.transactions.length,
      budgets: data.budgets.length,
      savingsGoals: data.savingsGoals.length
    };
  });
}

module.exports = { validateBackup, restore };
