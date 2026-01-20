import { Model, PipelineStage } from "mongoose";

interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class PaginationHelper {
  static async paginateFind<T>(
    model: Model<T>,
    query: any = {},
    { page = 1, limit = 10 }: PaginationQuery = {},
    projection: any = null,
    options: any = {}
  ): Promise<PaginationResult<T>> {
    const skip = (page - 1) * limit;

    const [dataRaw, total] = await Promise.all([
      model
        .find(query, projection, { ...options })
        .skip(skip)
        .limit(limit),
      model.countDocuments(query),
    ]);

    const data = dataRaw as unknown as T[];

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async paginateAggregate<T>(
    model: Model<T>,
    pipeline: PipelineStage[],
    { page = 1, limit = 10 }: PaginationQuery = {}
  ): Promise<PaginationResult<any>> {
    const skip = (page - 1) * limit;

    const countPipeline = [...pipeline, { $count: "total" }];

    const [data, countResult] = await Promise.all([
      model.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
      model.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
