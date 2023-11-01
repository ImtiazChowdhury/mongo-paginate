import { mongoDB } from "@imtiazchowdhury/mongopool";
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
        sortOrder: number;
    };
    data: mongoDB.Document[];
}
export interface FacetBucketQuery {
    key: string;
    query: mongoDB.Document[];
}
export type Paginate = (collection: string, prePagingState: mongoDB.Document[], postPagingStage: mongoDB.Document[], options: PaginationOptions, facet: FacetBucketQuery[]) => Promise<mongoDB.Document>;
