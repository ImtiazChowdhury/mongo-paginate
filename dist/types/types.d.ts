import { mongoDB } from "@imtiazchowdhury/mongopool";
import mongoose, { PipelineStage } from "mongoose";
export interface PaginationOptions {
    sort?: string;
    page?: number;
    limit?: number;
    sortOrder?: 1 | -1;
    fetchAll?: 1 | 0;
}
export interface PaginateResult {
    page: {
        totalPage: number;
        currentPage: number;
        nextPage: number;
        previousPage: number;
        startingIndex: number;
        endingIndex: number;
        itemsOnCurrentPage: number;
        limit: number;
        sort: string;
        sortOrder: 1 | -1;
    };
    data: mongoDB.Document[];
}
export interface FacetBucketQuery {
    key: string;
    query: mongoDB.Document[];
}
export type Paginate = (collection: string | mongoose.Model<mongoDB.Document> | mongoDB.Collection, prePagingState: PipelineStage[], postPagingStage: PipelineStage[], options: PaginationOptions, facet?: FacetBucketQuery[], aggregateOptions?: mongoDB.AggregateOptions) => Promise<mongoDB.Document>;
