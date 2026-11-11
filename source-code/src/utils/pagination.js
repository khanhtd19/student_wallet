'use strict';

function parsePage(value) {
  const parsed = Number.parseInt(String(value ?? '1'), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function createPagination(queryPage, totalRows, pageSize = 12) {
  const safePageSize = Math.max(1, Math.min(100, Number.parseInt(pageSize, 10) || 12));
  const total = Math.max(0, Number(totalRows) || 0);
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const page = Math.min(parsePage(queryPage), pageCount);
  return {
    page,
    pageSize: safePageSize,
    pageCount,
    total,
    offset: (page - 1) * safePageSize,
    from: total ? (page - 1) * safePageSize + 1 : 0,
    to: Math.min(page * safePageSize, total)
  };
}

module.exports = { createPagination, parsePage };
