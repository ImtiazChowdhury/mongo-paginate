import dbConnection, { mongoDB } from "@imtiazchowdhury/mongopool";
import { Paginate, PaginatePageInfo } from "./types/types";

const paginate: Paginate = async function (collection, prePagingStage, postPagingStage, options, facet, aggregateOptions) {

    let db = await dbConnection.getDB();

    let { sort: sortOption, page: pageOption, limit: limitOption, sortOrder = -1, fetchAll } = options;

    //defaults
    let sort: string;
    if (sortOption && typeof sortOption == "string") {
        sort = sortOption;
    } else {
        sort = 'createdDate'; //default sort by serial;
    }


    let limit = (limitOption && isFinite(limitOption) && limitOption > 0) ? limitOption : 50; //default limit is 50
    let page = pageOption && isFinite(pageOption) ? pageOption : 1; //default first page


    const aggregatePipeLine = [];
    aggregatePipeLine.push(...prePagingStage);

    //sort, skip, limit
    type SortStage = { $sort: { [index: string]: 1 | -1, _id: 1 } }[]
    const sortStage: SortStage = [
        { $sort: { [sort]: sortOrder, _id: 1 } }
    ]

    const pagingStage = [];
    if (fetchAll != 1) {
        pagingStage.push(...[
            { $skip: limit * (page - 1) },
            { $limit: limit }
        ])
    }

    postPagingStage.unshift(...sortStage, ...pagingStage)


    //check for any $group stage in agPipe pipeline
    // sort before $group does not work, has to be inserted after $group

    let groupIndex = 0;

    // get the last index of $group
    postPagingStage.forEach((item, index) => {
        if ("$group" in item || "$replaceRoot" in item) groupIndex = index;
    })
    postPagingStage.splice(groupIndex + 1, 0, ...sortStage);


    const facetStage: mongoDB.Document = {
        page: [
            {
                $count: "totalIndex"
            },
        ],
        data: postPagingStage,
    }

    if (facet && facet.length) {
        for (let stage of facet) {
            if (stage && stage.key && stage.query) facetStage[stage.key] = stage.query;
        }
    }
    aggregatePipeLine.push({ $facet: facetStage });


    let aggregateResult: mongoDB.Document[];

    if (typeof collection === "string") {
        aggregateResult = await db.collection(collection).aggregate(aggregatePipeLine, aggregateOptions).toArray();
    } else if (collection instanceof mongoDB.Collection) {
        aggregateResult = await collection.aggregate(aggregatePipeLine, aggregateOptions).toArray()
    } else {
        aggregateResult = await collection.aggregate(aggregatePipeLine, aggregateOptions).exec()
    }

    let result = aggregateResult[0];

    if (!result || !result["page"] || !result["page"][0]) return { page: {}, data: [] };


    if (fetchAll == 1) limit = result["data"].length;
    
    const totalIndex = result["page"][0].totalIndex;
    const totalPage = Math.ceil(totalIndex / limit);
    const startingIndex = limit * (page - 1) + 1;
    const pageInfo: PaginatePageInfo = {
        totalIndex,
        totalPage,
        currentPage: page,
        nextPage: totalPage > page ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
        startingIndex,
        endingIndex: startingIndex + result["data"].length - 1,
        itemsOnCurrentPage: result["data"].length,
        limit: limit,
        sort: sort,
        sortOrder: sortOrder
    }
    


    delete result["page"]
    return {
        page: pageInfo,
        data: result["data"],
        ...result
    };
};

export default paginate;

export {
    dbConnection,
    mongoDB
};

