/**
 * The response shapes the whole API uses. Nothing writes res.json directly,
 * which is what keeps the frontend's loading/success/empty/error handling
 * uniform across every endpoint.
 */

export const ok = (res, { message = "OK", data = null, status = 200, meta } = {}) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};

export const created = (res, { message = "Created", data = null } = {}) =>
  ok(res, { message, data, status: 201 });

export const paginated = (res, { message = "OK", data, pagination, meta }) => {
  const body = { success: true, message, data, pagination };
  if (meta) body.meta = meta;
  return res.status(200).json(body);
};

export const noData = (res, { message = "OK" } = {}) =>
  res.status(200).json({ success: true, message, data: null });