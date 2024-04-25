/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/inferschematype" />
import { mongoDB } from "@imtiazchowdhury/mongopool";
import { PipelineStage } from "mongoose";
export interface PaginationOptions {
    sort?: string;
    page?: number;
    limit?: number;
    sortOrder?: 1 | -1;
    fetchAll?: 1 | 0;
}
export interface PaginatePageInfo {
    totalIndex: number;
    totalPage: number;
    currentPage: number;
    nextPage: number | null;
    previousPage: number | null;
    startingIndex: number;
    endingIndex: number;
    itemsOnCurrentPage: number;
    limit: number;
    sort: string;
    sortOrder: 1 | -1;
}
export interface PaginateResult {
    page: PaginatePageInfo;
    data: mongoDB.Document[];
}
export interface EmptyPaginateResult {
    page: {};
    data: [];
}
export interface rawMongoDBResult {
    page?: {
        totalIndex: number;
    };
    data?: mongoDB.Document[];
}
export interface FacetBucketQuery {
    key: string;
    query: mongoDB.Document[];
}
export type Paginate = (collection: any, prePagingState: PipelineStage[], postPagingStage: PipelineStage[], options: PaginationOptions, facet?: FacetBucketQuery[], aggregateOptions?: mongoDB.AggregateOptions) => Promise<PaginateResult | EmptyPaginateResult>;
