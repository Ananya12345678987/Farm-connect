const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

/** Reads page/limit from a query string, clamped so a client cannot ask for
 *  the entire collection in one request. */
export const readPageParams = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const rawLimit = Number.parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  return { page, limit, skip: (page - 1) * limit };
};

export const buildPagination = ({ page, limit, total }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

/** Runs a find and its count in parallel and returns both halves. */
export const paginate = async (model, filter, { page, limit, skip, sort, select, populate, lean = true }) => {
  let query = model.find(filter).sort(sort).skip(skip).limit(limit);
  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);
  if (lean) query = query.lean();

  const [data, total] = await Promise.all([query, model.countDocuments(filter)]);
  return { data, pagination: buildPagination({ page, limit, total }) };
};
