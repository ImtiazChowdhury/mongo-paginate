"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoDB = exports.dbConnection = void 0;
const mongopool_1 = __importStar(require("@imtiazchowdhury/mongopool"));
exports.dbConnection = mongopool_1.default;
Object.defineProperty(exports, "mongoDB", { enumerable: true, get: function () { return mongopool_1.mongoDB; } });
const paginate = function (collection, prePagingStage, postPagingStage, options, facet) {
    return __awaiter(this, void 0, void 0, function* () {
        let db = yield mongopool_1.default.getDB();
        let { sort: sortOption, page: pageOption, limit: limitOption, sortOrder, fetchAll } = options;
        //defaults
        let sort;
        if (sortOption && typeof sortOption == "string") {
            sort = sortOption;
        }
        else {
            sort = 'createdDate'; //default sort by serial;
        }
        if (sortOrder === 1) {
            sortOrder = 1;
        }
        else
            sortOrder = -1; //default 1
        let limit = (limitOption && isFinite(limitOption) && limitOption > 0) ? limitOption : 50; //default limit is 50
        let page = pageOption && isFinite(pageOption) ? pageOption : 1; //default first page
        let aggregatePipeLine = [];
        aggregatePipeLine.push(...prePagingStage);
        //sort, skip, limit
        let sortStage = [
            { $sort: { [sort]: sortOrder, _id: 1 } }
        ];
        const pagingStage = [];
        if (fetchAll != 1) {
            pagingStage.push(...[
                { $skip: limit * (page - 1) },
                { $limit: limit }
            ]);
        }
        postPagingStage.unshift(...sortStage, ...pagingStage);
        //check for any $group stage in agPipe pipeline
        // sort before $group does not work, has to be inserted after $group
        let groupIndex = 0;
        // get the last index of $group
        postPagingStage.forEach((item, index) => {
            if (item['$group'] || item['$replaceRoot'])
                groupIndex = index;
        });
        postPagingStage.splice(groupIndex + 1, 0, ...sortStage);
        const facetStage = {
            page: [
                {
                    $count: "totalIndex"
                },
            ],
            data: postPagingStage,
        };
        if (facet && facet.length) {
            for (let stage of facet) {
                if (stage && stage.key && stage.query)
                    facetStage[stage.key] = stage.query;
            }
        }
        aggregatePipeLine.push({ $facet: facetStage });
        let aggregateResult = yield db.collection(collection).aggregate(aggregatePipeLine).toArray();
        let result = aggregateResult[0];
        if (!result || !result["page"] || !result["page"][0])
            return { page: {}, data: [] };
        let pageInfo = result["page"][0];
        if (fetchAll == 1)
            limit = result["data"].length;
        pageInfo.totalPage = Math.ceil(pageInfo.totalIndex / limit);
        pageInfo.currentPage = page;
        pageInfo.nextPage = pageInfo.totalPage > page ? page + 1 : null;
        pageInfo.previousPage = page > 1 ? page - 1 : null;
        pageInfo.startingIndex = limit * (page - 1) + 1;
        pageInfo.endingIndex = pageInfo.startingIndex + result["data"].length - 1;
        pageInfo.itemsOnCurrentPage = result["data"].length;
        pageInfo.limit = limit;
        pageInfo.sort = sort;
        pageInfo.sortOrder = sortOrder;
        delete result["page"];
        return Object.assign({ page: pageInfo }, result);
    });
};
exports.default = paginate;